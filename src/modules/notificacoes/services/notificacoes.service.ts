import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  BadRequestException,
  Inject,
  Optional,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, In, Brackets } from "typeorm";
import { Subject, Observable } from "rxjs";
import {
  Notificacao,
  TipoNotificacao,
  PrioridadeNotificacao,
  NotificationPreferences,
} from "../entities";
import { User } from "../../users/entities/user.entity";
import { Tarefa } from "../../tarefas/entities/tarefa.entity";
import { DesarquivamentoTypeOrmEntity } from "../../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "../../nugecid/domain/enums/status-desarquivamento.enum";
import {
  CACHE_VERSION_INITIAL,
  CACHE_VERSION_KEYS,
} from "../../../common/constants/cache-version.constants";
import { RuntimeMetricsService } from "../../observability/runtime-metrics.service";

export interface CreateNotificacaoDto {
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  prioridade?: PrioridadeNotificacao;
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
  tarefaId?: number;
  projetoId?: number;
  remetenteId?: number;
  link?: string;
}

export interface QueryNotificacoesDto {
  page?: number;
  limit?: number;
  lida?: boolean;
  tipo?: TipoNotificacao;
  prioridade?: PrioridadeNotificacao;
  dataInicio?: Date;
  dataFim?: Date;
  cursorCreatedAt?: string;
  cursorId?: number;
}

@Injectable()
export class NotificacoesService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificacoesService.name);
  private static readonly LIST_CACHE_TTL_SECONDS = 10;

  /**
   * Per-user RxJS Subjects for real-time SSE push.
   * Key = userId, Value = Subject that emits Notificacao whenever one is created for that user.
   */
  private readonly userSubjects = new Map<number, Subject<Notificacao>>();

  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    @InjectRepository(NotificationPreferences)
    private readonly preferencesRepository: Repository<NotificationPreferences>,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
    @Optional()
    private readonly runtimeMetricsService?: RuntimeMetricsService,
  ) {}

  onModuleDestroy() {
    // Complete all subjects when the module is destroyed
    for (const subject of this.userSubjects.values()) {
      subject.complete();
    }
    this.userSubjects.clear();
  }

  /**
   * Returns an Observable stream of new notifications for a given user.
   * The controller subscribes to this for the SSE endpoint.
   */
  getUserStream(userId: number): Observable<Notificacao> {
    return this.getOrCreateSubject(userId).asObservable();
  }

  /**
   * Removes the Subject for a user (called when their SSE connection closes).
   * If no more subscribers, the subject is cleaned up.
   */
  removeUserStream(userId: number): void {
    const subject = this.userSubjects.get(userId);
    if (subject && !subject.observed) {
      subject.complete();
      this.userSubjects.delete(userId);
    }
  }

  private getOrCreateSubject(userId: number): Subject<Notificacao> {
    let subject = this.userSubjects.get(userId);
    if (!subject) {
      subject = new Subject<Notificacao>();
      this.userSubjects.set(userId, subject);
    }
    return subject;
  }

  /**
   * Emits a notification to the user's SSE stream (if connected).
   */
  private emitToUser(userId: number, notificacao: Notificacao): void {
    const subject = this.userSubjects.get(userId);
    if (subject && subject.observed) {
      subject.next(notificacao);
    }
  }

  private async saveAndEmit(notificacao: Notificacao): Promise<Notificacao> {
    const saved = await this.notificacaoRepository.save(notificacao);
    this.emitToUser(saved.usuarioId, saved);
    await this.bumpReadCachesVersion();
    return saved;
  }

  private async bumpReadCachesVersion(): Promise<void> {
    await Promise.allSettled([
      this.bumpCacheVersion(CACHE_VERSION_KEYS.APP_GLOBAL_SEARCH),
      this.bumpCacheVersion(CACHE_VERSION_KEYS.NOTIFICACOES_LIST),
    ]);
  }

  private async bumpCacheVersion(versionKey: string): Promise<void> {
    if (!this.cacheManager) {
      return;
    }

    try {
      const raw = await this.cacheManager.get<number | string>(versionKey);
      const current = Number(raw);
      const next =
        Number.isFinite(current) && current > 0
          ? current + 1
          : CACHE_VERSION_INITIAL + 1;
      await this.cacheManager.set(versionKey, next);
    } catch (error) {
      this.logger.warn(
        `Falha ao invalidar cache (${versionKey}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async getCacheVersion(versionKey: string): Promise<number> {
    if (!this.cacheManager) {
      return CACHE_VERSION_INITIAL;
    }

    try {
      const raw = await this.cacheManager.get<number | string>(versionKey);
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
      return CACHE_VERSION_INITIAL;
    } catch (error) {
      this.logger.warn(
        `Falha ao obter versão de cache (${versionKey}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return CACHE_VERSION_INITIAL;
    }
  }

  private async getFromCache<T>(key: string): Promise<T | undefined> {
    if (!this.cacheManager) {
      return undefined;
    }

    const namespace = "notificacoes";
    try {
      const cached = await this.cacheManager.get<T>(key);
      if (cached === undefined || cached === null) {
        this.runtimeMetricsService?.recordCacheMiss(namespace);
      } else {
        this.runtimeMetricsService?.recordCacheHit(namespace);
      }
      return cached ?? undefined;
    } catch (error) {
      this.runtimeMetricsService?.recordCacheError(namespace);
      this.logger.warn(
        `Falha ao ler cache (${key}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return undefined;
    }
  }

  private async setInCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.cacheManager) {
      return;
    }

    const namespace = "notificacoes";
    try {
      await this.cacheManager.set(key, value, ttlSeconds);
      this.runtimeMetricsService?.recordCacheSet(namespace);
    } catch (error) {
      this.runtimeMetricsService?.recordCacheError(namespace);
      this.logger.warn(
        `Falha ao gravar cache (${key}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async create(
    createNotificacaoDto: CreateNotificacaoDto,
  ): Promise<Notificacao | null> {
    const saved = await this.createMany([createNotificacaoDto]);
    return saved[0] ?? null;
  }

  /**
   * Cria múltiplas notificações com validação em lote
   * para evitar N+1 em cenários de alto volume.
   */
  async createMany(
    createNotificacaoDtos: CreateNotificacaoDto[],
  ): Promise<Notificacao[]> {
    if (!createNotificacaoDtos.length) {
      return [];
    }

    const userIds = Array.from(
      new Set(createNotificacaoDtos.map((dto) => dto.usuarioId)),
    );

    const [usuarios, preferencias] = await Promise.all([
      this.loadUsersByIds(userIds),
      this.loadPreferencesForUsers(userIds),
    ]);

    const usuariosExistentes = new Set(usuarios.map((usuario) => usuario.id));
    const usuariosAusentes = userIds.filter(
      (id) => !usuariosExistentes.has(id),
    );
    if (usuariosAusentes.length) {
      throw new NotFoundException(
        `Usuário(s) não encontrado(s): ${usuariosAusentes.join(", ")}`,
      );
    }

    const preferenciasPorUsuario = new Map(
      preferencias.map((preferencia) => [preferencia.userId, preferencia]),
    );

    const solicitacaoIds = Array.from(
      new Set(
        createNotificacaoDtos
          .map((dto) => dto.solicitacaoId)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    if (solicitacaoIds.length) {
      const solicitacoes = await this.loadSolicitacoesByIds(solicitacaoIds);
      const solicitacoesExistentes = new Set(
        solicitacoes.map((solicitacao) => solicitacao.id),
      );
      const solicitacoesAusentes = solicitacaoIds.filter(
        (id) => !solicitacoesExistentes.has(id),
      );
      if (solicitacoesAusentes.length) {
        throw new NotFoundException(
          `Solicitação(ões) não encontrada(s): ${solicitacoesAusentes.join(", ")}`,
        );
      }
    }

    const dtosPermitidos = createNotificacaoDtos.filter((dto) => {
      const preferenciasUsuario = preferenciasPorUsuario.get(dto.usuarioId);
      if (!preferenciasUsuario) {
        return true;
      }
      const canReceive = preferenciasUsuario.canReceiveNotification(
        dto.tipo,
        "in_app",
      );
      if (!canReceive) {
        this.logger.debug(
          `Notificação ${dto.tipo} bloqueada pelas preferências do usuário ${dto.usuarioId}`,
        );
      }
      return canReceive;
    });

    if (!dtosPermitidos.length) {
      return [];
    }

    const entidades = dtosPermitidos.map((dto) =>
      this.notificacaoRepository.create({
        ...dto,
        prioridade: dto.prioridade || PrioridadeNotificacao.MEDIA,
      }),
    );

    const savedRaw = await this.notificacaoRepository.save(entidades, {
      chunk: 200,
    });
    const saved = Array.isArray(savedRaw) ? savedRaw : [savedRaw];

    for (const notificacao of saved) {
      this.emitToUser(notificacao.usuarioId, notificacao);
    }

    await this.bumpReadCachesVersion();

    return saved;
  }

  private async loadUsersByIds(userIds: number[]): Promise<User[]> {
    const repositoryWithFind = this.userRepository as unknown as {
      find?: (options: unknown) => Promise<User[]>;
    };

    if (typeof repositoryWithFind.find === "function") {
      const users = await repositoryWithFind.find({
        where: { id: In(userIds) },
        select: ["id"],
      });
      if (Array.isArray(users) && users.length) {
        return users;
      }
    }

    const users = await Promise.all(
      userIds.map((id) =>
        this.userRepository.findOne({
          where: { id },
          select: ["id"],
        }),
      ),
    );
    return users.filter((user): user is User => user !== null);
  }

  private async loadSolicitacoesByIds(ids: number[]): Promise<Tarefa[]> {
    const repositoryWithFind = this.tarefaRepository as unknown as {
      find?: (options: unknown) => Promise<Tarefa[]>;
    };

    if (typeof repositoryWithFind.find === "function") {
      const tarefas = await repositoryWithFind.find({
        where: { id: In(ids) },
        select: ["id"],
      });
      return Array.isArray(tarefas) ? tarefas : [];
    }

    const tarefas = await Promise.all(
      ids.map((id) =>
        this.tarefaRepository.findOne({
          where: { id },
          select: ["id"],
        }),
      ),
    );
    return tarefas.filter((tarefa): tarefa is Tarefa => tarefa !== null);
  }

  private async loadPreferencesForUsers(
    userIds: number[],
  ): Promise<NotificationPreferences[]> {
    const repositoryWithFind = this.preferencesRepository as unknown as {
      find?: (options: unknown) => Promise<NotificationPreferences[]>;
    };

    if (typeof repositoryWithFind.find === "function") {
      try {
        const preferencias = await repositoryWithFind.find({
          where: { userId: In(userIds) },
        });
        return Array.isArray(preferencias) ? preferencias : [];
      } catch (error) {
        this.logger.warn(
          `Erro ao buscar preferências em lote: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return [];
      }
    }

    // Compatibilidade com mocks antigos de teste que expõem apenas `findOne`.
    const preferencias = await Promise.all(
      userIds.map((userId) =>
        this.preferencesRepository
          .findOne({
            where: { userId },
          })
          .catch((error) => {
            this.logger.warn(
              `Erro ao buscar preferências do usuário ${userId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
            return null;
          }),
      ),
    );
    return preferencias.filter(
      (preferencia): preferencia is NotificationPreferences =>
        preferencia !== null,
    );
  }

  /**
   * Verifica se o usuário pode receber uma notificação de um tipo específico
   * com base nas suas preferências.
   */
  private async checkUserPreferences(
    userId: number,
    tipo: TipoNotificacao,
  ): Promise<boolean> {
    try {
      const preferences = await this.preferencesRepository.findOne({
        where: { userId },
      });

      // Se não há preferências cadastradas, permitir (default)
      if (!preferences) {
        return true;
      }

      return preferences.canReceiveNotification(tipo, "in_app");
    } catch (error) {
      // Em caso de erro ao buscar preferências, permitir a notificação
      // para não bloquear notificações críticas
      this.logger.warn(
        `Erro ao verificar preferências do usuário ${userId}: ${error.message}`,
      );
      return true;
    }
  }

  async findByUsuario(
    usuarioId: number,
    queryDto: QueryNotificacoesDto = {},
  ): Promise<{
    data: Notificacao[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    nextCursor?: {
      createdAt: string;
      id: number;
    };
  }> {
    const page = Math.max(1, Number(queryDto.page || 1));
    const limit = Math.max(1, Math.min(100, Number(queryDto.limit || 20)));
    const skip = (page - 1) * limit;
    const hasCursor = Boolean(queryDto.cursorCreatedAt);
    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.NOTIFICACOES_LIST,
    );
    const normalizedFilters = {
      lida: queryDto.lida ?? null,
      tipo: queryDto.tipo ?? null,
      prioridade: queryDto.prioridade ?? null,
      dataInicio: queryDto.dataInicio
        ? new Date(queryDto.dataInicio).toISOString()
        : null,
      dataFim: queryDto.dataFim
        ? new Date(queryDto.dataFim).toISOString()
        : null,
      cursorCreatedAt: queryDto.cursorCreatedAt ?? null,
      cursorId: queryDto.cursorId ?? null,
    };
    const cacheKey = [
      "notificacoes:list",
      `v:${cacheVersion}`,
      `u:${usuarioId}`,
      `p:${page}`,
      `l:${limit}`,
      `f:${JSON.stringify(normalizedFilters)}`,
    ].join("|");
    const cached = await this.getFromCache<{
      data: Notificacao[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      nextCursor?: {
        createdAt: string;
        id: number;
      };
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Verificar se o usuário existe apenas em cache miss
    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
      select: ["id"],
    });

    if (!usuario) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const queryBuilder = this.notificacaoRepository
      .createQueryBuilder("notificacao")
      .where("notificacao.usuarioId = :usuarioId", { usuarioId })
      .andWhere("notificacao.deletedAt IS NULL");

    // Aplicar filtros
    if (queryDto.lida !== undefined) {
      queryBuilder.andWhere("notificacao.lida = :lida", {
        lida: queryDto.lida,
      });
    }

    if (queryDto.tipo) {
      queryBuilder.andWhere("notificacao.tipo = :tipo", {
        tipo: queryDto.tipo,
      });
    }

    if (queryDto.prioridade) {
      queryBuilder.andWhere("notificacao.prioridade = :prioridade", {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto.dataInicio && queryDto.dataFim) {
      queryBuilder.andWhere(
        "notificacao.createdAt BETWEEN :dataInicio AND :dataFim",
        {
          dataInicio: queryDto.dataInicio,
          dataFim: queryDto.dataFim,
        },
      );
    }

    const totalQueryBuilder = queryBuilder.clone();

    // Ordenação por prioridade e data
    queryBuilder
      .addSelect(
        "CASE notificacao.prioridade WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 WHEN 'baixa' THEN 4 ELSE 5 END",
        "prioridade_order",
      )
      .orderBy("prioridade_order", "ASC")
      .addOrderBy("notificacao.createdAt", "DESC")
      .addOrderBy("notificacao.id", "DESC");

    if (hasCursor) {
      const cursorDate = new Date(queryDto.cursorCreatedAt as string);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException(
          "cursorCreatedAt inválido. Use formato ISO-8601.",
        );
      }
      const cursorId = Number.isFinite(Number(queryDto.cursorId))
        ? Number(queryDto.cursorId)
        : Number.MAX_SAFE_INTEGER;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("notificacao.createdAt < :cursorDate", {
            cursorDate,
          }).orWhere(
            "notificacao.createdAt = :cursorDate AND notificacao.id < :cursorId",
            { cursorDate, cursorId },
          );
        }),
      );
    }

    const [data, total] = await Promise.all([
      hasCursor
        ? queryBuilder.take(limit).getMany()
        : queryBuilder.skip(skip).take(limit).getMany(),
      totalQueryBuilder.getCount(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const lastItem = data[data.length - 1];
    const nextCursor = hasCursor
      ? lastItem
        ? {
            createdAt: lastItem.createdAt.toISOString(),
            id: lastItem.id,
          }
        : undefined
      : undefined;

    const result = {
      data,
      total,
      page,
      limit,
      totalPages,
      nextCursor,
    };

    await this.setInCache(
      cacheKey,
      result,
      NotificacoesService.LIST_CACHE_TTL_SECONDS,
    );

    return result;
  }

  async findOne(id: number, usuarioId: number): Promise<Notificacao> {
    const notificacao = await this.notificacaoRepository.findOne({
      where: { id, usuarioId },
      relations: ["usuario", "solicitacao"],
    });

    if (!notificacao) {
      throw new NotFoundException("Notificação não encontrada");
    }

    return notificacao;
  }

  async marcarComoLida(id: number, usuarioId: number): Promise<Notificacao> {
    const notificacao = await this.findOne(id, usuarioId);

    notificacao.marcarComoLida();
    const saved = await this.notificacaoRepository.save(notificacao);
    await this.bumpReadCachesVersion();
    return saved;
  }

  async marcarComoNaoLida(id: number, usuarioId: number): Promise<Notificacao> {
    const notificacao = await this.findOne(id, usuarioId);

    notificacao.marcarComoNaoLida();
    const saved = await this.notificacaoRepository.save(notificacao);
    await this.bumpReadCachesVersion();
    return saved;
  }

  async marcarTodasComoLidas(usuarioId: number): Promise<number> {
    const result = await this.notificacaoRepository.update(
      { usuarioId, lida: false },
      { lida: true },
    );

    if ((result.affected || 0) > 0) {
      await this.bumpReadCachesVersion();
    }

    return result.affected || 0;
  }

  async delete(id: number, usuarioId: number): Promise<void> {
    await this.findOne(id, usuarioId);

    await this.notificacaoRepository.softDelete(id);
    await this.bumpReadCachesVersion();
  }

  async getEstatisticas(usuarioId: number): Promise<{
    total: number;
    naoLidas: number;
    lidas: number;
    porTipo: Record<string, number>;
    porPrioridade: Record<string, number>;
  }> {
    // Otimizado: usar queries SQL agregadas ao invés de carregar tudo em memória
    const [contagens, porTipoResult, porPrioridadeResult] = await Promise.all([
      // Contagem total, lidas e não lidas em uma única query
      this.notificacaoRepository
        .createQueryBuilder("n")
        .select("COUNT(*)", "total")
        .addSelect("SUM(CASE WHEN n.lida = true THEN 1 ELSE 0 END)", "lidas")
        .addSelect(
          "SUM(CASE WHEN n.lida = false THEN 1 ELSE 0 END)",
          "naoLidas",
        )
        .where("n.usuarioId = :usuarioId", { usuarioId })
        .andWhere("n.deletedAt IS NULL")
        .getRawOne(),

      // Contagem por tipo
      this.notificacaoRepository
        .createQueryBuilder("n")
        .select("n.tipo", "tipo")
        .addSelect("COUNT(*)", "count")
        .where("n.usuarioId = :usuarioId", { usuarioId })
        .andWhere("n.deletedAt IS NULL")
        .groupBy("n.tipo")
        .getRawMany(),

      // Contagem por prioridade
      this.notificacaoRepository
        .createQueryBuilder("n")
        .select("n.prioridade", "prioridade")
        .addSelect("COUNT(*)", "count")
        .where("n.usuarioId = :usuarioId", { usuarioId })
        .andWhere("n.deletedAt IS NULL")
        .groupBy("n.prioridade")
        .getRawMany(),
    ]);

    const porTipo = porTipoResult.reduce(
      (acc, row) => {
        acc[row.tipo] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    const porPrioridade = porPrioridadeResult.reduce(
      (acc, row) => {
        acc[row.prioridade] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: parseInt(contagens.total, 10) || 0,
      naoLidas: parseInt(contagens.naoLidas, 10) || 0,
      lidas: parseInt(contagens.lidas, 10) || 0,
      porTipo,
      porPrioridade,
    };
  }

  async findLatestByTipo(
    tipo: TipoNotificacao,
    usuarioId?: number,
  ): Promise<Notificacao | null> {
    const where: any = { tipo, deletedAt: null };
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }
    return this.notificacaoRepository.findOne({
      where,
      order: { createdAt: "DESC" },
    });
  }

  // Métodos específicos para tipos de notificação
  async criarNotificacaoSolicitacaoPendente(
    usuarioId: number,
    solicitacaoId: number,
    diasPendentes: number,
  ): Promise<Notificacao | null> {
    const titulo = `Solicitação Pendente há ${diasPendentes} dias`;
    const descricao =
      "Uma solicitação está pendente há mais de 5 dias sem movimentação.";
    const detalhes = {
      dias_pendentes: diasPendentes,
      data_limite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
      acao_requerida: "Verificar status da solicitação",
    };

    return this.create({
      tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
      titulo,
      descricao,
      detalhes,
      prioridade: PrioridadeNotificacao.ALTA,
      usuarioId,
      solicitacaoId,
    });
  }

  async criarNotificacaoNovoProcesso(
    usuarioId: number,
    processoId: number,
    numeroProcesso: string,
  ): Promise<Notificacao | null> {
    const titulo = "Novo Processo de Desarquivamento";
    const descricao = `Um novo processo de desarquivamento foi extraído do SEIRN: ${numeroProcesso}`;
    const detalhes = {
      numero_processo: numeroProcesso,
      fonte: "SEIRN",
      data_extracao: new Date(),
      acao_requerida: "Analisar novo processo",
    };

    return this.create({
      tipo: TipoNotificacao.NOVO_PROCESSO,
      titulo,
      descricao,
      detalhes,
      prioridade: PrioridadeNotificacao.MEDIA,
      usuarioId,
      processoId,
    });
  }

  // Método para verificar solicitações pendentes (para ser executado periodicamente)
  async verificarSolicitacoesPendentes(): Promise<Notificacao[]> {
    const cincoDiasAtras = new Date();
    cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);

    const notificacoesCriadas: Notificacao[] = [];

    // Buscar desarquivamentos e gestores em paralelo
    const [desarquivamentosPendentes, gestores] = await Promise.all([
      this.desarquivamentoRepository.find({
        where: {
          status: StatusDesarquivamentoEnum.SOLICITADO,
          dataSolicitacao: LessThan(cincoDiasAtras),
        },
      }),
      this.userRepository.find({
        where: [{ role: { name: "coordenador" } }, { role: { name: "admin" } }],
        relations: ["role"],
      }),
    ]);

    const gestoresIds = gestores.map((g) => g.id);

    // Coletar todos os IDs de desarquivamentos e usuários para buscar notificações existentes de uma vez
    const desarquivamentoIds = desarquivamentosPendentes.map((d) => d.id);

    // Buscar notificações criadas nas últimas 24h para evitar duplicatas
    // NÃO filtrar por lida=false — se já notificou hoje, não notifica de novo
    // mesmo que o usuário tenha marcado como lida
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const notificacoesExistentes =
      desarquivamentoIds.length > 0
        ? await this.notificacaoRepository
            .createQueryBuilder("n")
            .select(["n.processoId", "n.usuarioId"])
            .where("n.tipo = :tipo", {
              tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
            })
            .andWhere("n.processoId IN (:...ids)", { ids: desarquivamentoIds })
            .andWhere("n.createdAt > :umDiaAtras", { umDiaAtras })
            .getRawMany()
        : [];

    // Criar um Set para lookup rápido
    const notificacoesExistentesSet = new Set(
      notificacoesExistentes.map((n) => `${n.n_processoId}-${n.n_usuarioId}`),
    );

    // Processar desarquivamentos
    const notificacoesParaCriar: Array<{
      usuarioId: number;
      desarquivamento: DesarquivamentoTypeOrmEntity;
      diasPendentes: number;
    }> = [];

    // Buscar tarefas que não foram movimentadas há mais de 5 dias
    const solicitacoesPendentes = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoin("tarefa.coluna", "coluna")
      .where("tarefa.updatedAt < :cincoDiasAtras", { cincoDiasAtras })
      .andWhere("coluna.nome ILIKE :colunaSolicitada", {
        colunaSolicitada: "%solicit%",
      })
      .getMany();

    // Coletar todos os IDs de usuários que precisam ser validados
    const usuariosIdsParaValidar = new Set<number>(gestoresIds);
    for (const desarquivamento of desarquivamentosPendentes) {
      if (desarquivamento.criadoPorId) {
        usuariosIdsParaValidar.add(desarquivamento.criadoPorId);
      }
      if (desarquivamento.responsavelId) {
        usuariosIdsParaValidar.add(desarquivamento.responsavelId);
      }
    }

    // Adicionar IDs de usuários das tarefas
    for (const solicitacao of solicitacoesPendentes) {
      if (solicitacao.responsavelId) {
        usuariosIdsParaValidar.add(solicitacao.responsavelId);
      }
      if (solicitacao.criadorId) {
        usuariosIdsParaValidar.add(solicitacao.criadorId);
      }
    }

    // Buscar todos os usuários válidos de uma vez
    const usuariosValidos =
      usuariosIdsParaValidar.size > 0
        ? await this.userRepository.find({
            where: { id: In(Array.from(usuariosIdsParaValidar)) },
            select: ["id"],
          })
        : [];

    const usuariosValidosSet = new Set(usuariosValidos.map((u) => u.id));

    for (const desarquivamento of desarquivamentosPendentes) {
      const diasPendentes = Math.floor(
        (Date.now() - new Date(desarquivamento.dataSolicitacao).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const destinatarios = new Set<number>(gestoresIds);
      if (
        desarquivamento.criadoPorId &&
        usuariosValidosSet.has(desarquivamento.criadoPorId)
      ) {
        destinatarios.add(desarquivamento.criadoPorId);
      }
      if (
        desarquivamento.responsavelId &&
        usuariosValidosSet.has(desarquivamento.responsavelId)
      ) {
        destinatarios.add(desarquivamento.responsavelId);
      }

      for (const usuarioId of destinatarios) {
        if (!usuarioId || !usuariosValidosSet.has(usuarioId)) continue;

        const chave = `${desarquivamento.id}-${usuarioId}`;
        if (!notificacoesExistentesSet.has(chave)) {
          notificacoesParaCriar.push({
            usuarioId,
            desarquivamento,
            diasPendentes,
          });
        }
      }
    }

    const notificacoesDesarquivamentos = await Promise.all(
      notificacoesParaCriar.map(
        ({ usuarioId, desarquivamento, diasPendentes }) =>
          this.criarNotificacaoArquivoSolicitado(
            usuarioId,
            desarquivamento,
            diasPendentes,
          ),
      ),
    );
    notificacoesCriadas.push(
      ...notificacoesDesarquivamentos.filter(
        (n): n is Notificacao => n !== null,
      ),
    );

    // Buscar notificações existentes para tarefas de uma vez (últimas 24h)
    const tarefaIds = solicitacoesPendentes.map((s) => s.id);
    const notificacoesTarefasExistentes =
      tarefaIds.length > 0
        ? await this.notificacaoRepository
            .createQueryBuilder("n")
            .select("n.solicitacaoId")
            .where("n.tipo = :tipo", {
              tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
            })
            .andWhere("n.solicitacaoId IN (:...ids)", { ids: tarefaIds })
            .andWhere("n.createdAt > :umDiaAtras", { umDiaAtras })
            .getRawMany()
        : [];

    const tarefasComNotificacao = new Set(
      notificacoesTarefasExistentes.map((n) => n.n_solicitacaoId),
    );

    const pendenciasParaNotificar = solicitacoesPendentes
      .filter((solicitacao) => !tarefasComNotificacao.has(solicitacao.id))
      .map((solicitacao) => {
        const diasPendentes = Math.floor(
          (Date.now() - solicitacao.updatedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const usuarioId = solicitacao.responsavelId || solicitacao.criadorId;
        return {
          solicitacaoId: solicitacao.id,
          diasPendentes,
          usuarioId,
        };
      })
      .filter(
        (
          item,
        ): item is {
          solicitacaoId: number;
          diasPendentes: number;
          usuarioId: number;
        } => !!item.usuarioId && usuariosValidosSet.has(item.usuarioId),
      );

    const notificacoesSolicitacoes = await Promise.all(
      pendenciasParaNotificar.map((item) =>
        this.criarNotificacaoSolicitacaoPendente(
          item.usuarioId,
          item.solicitacaoId,
          item.diasPendentes,
        ),
      ),
    );
    notificacoesCriadas.push(
      ...notificacoesSolicitacoes.filter((n): n is Notificacao => n !== null),
    );

    return notificacoesCriadas;
  }

  private async criarNotificacaoArquivoSolicitado(
    usuarioId: number,
    desarquivamento: DesarquivamentoTypeOrmEntity,
    diasPendentes: number,
  ): Promise<Notificacao | null> {
    const dataSolicitacaoFormatada = desarquivamento.dataSolicitacao
      ? new Intl.DateTimeFormat("pt-BR").format(
          new Date(desarquivamento.dataSolicitacao),
        )
      : "Data não informada";

    const titulo = `${
      desarquivamento.nomeCompleto || "Desarquivamento"
    } — aguardando há ${diasPendentes} dia${diasPendentes === 1 ? "" : "s"}`;

    const descricao =
      [
        desarquivamento.numeroProcesso
          ? `Processo ${desarquivamento.numeroProcesso}`
          : null,
        desarquivamento.tipoDocumento,
        `Solicitado em ${dataSolicitacaoFormatada}`,
      ]
        .filter(Boolean)
        .join(" • ") || "Desarquivamento permanece sem retorno.";

    const detalhes = {
      dias_pendentes: diasPendentes,
      numero_processo: desarquivamento.numeroProcesso,
      tipo_documento: desarquivamento.tipoDocumento,
      nome_completo: desarquivamento.nomeCompleto,
      data_solicitacao: desarquivamento.dataSolicitacao,
      acao_requerida: "Verificar andamento do desarquivamento",
    };

    return this.create({
      tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
      titulo,
      descricao,
      detalhes,
      prioridade: PrioridadeNotificacao.ALTA,
      usuarioId,
      processoId: desarquivamento.id,
    });
  }

  // ========== NOVOS MÉTODOS PARA TAREFAS ==========

  async notificarMencao(
    usuarioMencionadoId: number,
    remetenteId: number,
    tarefaId: number,
    comentario: string,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioMencionadoId,
      TipoNotificacao.MENCAO,
    );
    if (!canReceive) return null;

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.MENCAO,
      titulo: `${remetente?.nome || "Alguém"} mencionou você`,
      descricao: `Você foi mencionado em um comentário na tarefa "${tarefa.titulo}"`,
      detalhes: {
        comentario: comentario.substring(0, 200),
        projeto: tarefa.projeto?.nome,
      },
      prioridade: PrioridadeNotificacao.MEDIA,
      usuarioId: usuarioMencionadoId,
      tarefaId,
      remetenteId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.saveAndEmit(notificacao);
  }

  async notificarTarefaAtribuida(
    usuarioAtribuidoId: number,
    remetenteId: number,
    tarefaId: number,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioAtribuidoId,
      TipoNotificacao.TAREFA_ATRIBUIDA,
    );
    if (!canReceive) return null;

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_ATRIBUIDA,
      titulo: "Nova tarefa atribuída",
      descricao: `${remetente?.nome || "Alguém"} atribuiu você à tarefa "${tarefa.titulo}"`,
      detalhes: {
        prioridade: tarefa.prioridade,
        prazo: tarefa.prazo,
        projeto: tarefa.projeto?.nome,
      },
      prioridade: this.mapPrioridadeTarefaParaNotificacao(tarefa.prioridade),
      usuarioId: usuarioAtribuidoId,
      tarefaId,
      remetenteId,
      projetoId: tarefa.projetoId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.saveAndEmit(notificacao);
  }

  async notificarTarefaAlterada(
    usuarioId: number,
    remetenteId: number,
    tarefaId: number,
    mudancas: string[],
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioId,
      TipoNotificacao.TAREFA_ALTERADA,
    );
    if (!canReceive) return null;

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_ALTERADA,
      titulo: "Tarefa atualizada",
      descricao: `${remetente?.nome || "Alguém"} atualizou a tarefa "${tarefa.titulo}"`,
      detalhes: {
        mudancas,
      },
      prioridade: PrioridadeNotificacao.BAIXA,
      usuarioId,
      tarefaId,
      remetenteId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.saveAndEmit(notificacao);
  }

  async notificarComentario(
    usuarioId: number,
    remetenteId: number,
    tarefaId: number,
    comentario: string,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioId,
      TipoNotificacao.TAREFA_COMENTADA,
    );
    if (!canReceive) return null;

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_COMENTADA,
      titulo: "Novo comentário",
      descricao: `${remetente?.nome || "Alguém"} comentou na tarefa "${tarefa.titulo}"`,
      detalhes: {
        comentario: comentario.substring(0, 200),
      },
      prioridade: PrioridadeNotificacao.BAIXA,
      usuarioId,
      tarefaId,
      remetenteId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.saveAndEmit(notificacao);
  }

  async notificarPrazoProximo(
    usuarioId: number,
    tarefaId: number,
    diasRestantes: number,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioId,
      TipoNotificacao.PRAZO_PROXIMO,
    );
    if (!canReceive) return null;

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      select: ["id", "titulo", "prazo", "prioridade"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    return this.salvarNotificacaoPrazoProximo(usuarioId, tarefa, diasRestantes);
  }

  async notificarTarefaAtrasada(
    usuarioId: number,
    tarefaId: number,
    diasAtrasados: number,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioId,
      TipoNotificacao.TAREFA_ATRASADA,
    );
    if (!canReceive) return null;

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      select: ["id", "titulo", "prazo", "prioridade"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    return this.salvarNotificacaoTarefaAtrasada(
      usuarioId,
      tarefa,
      diasAtrasados,
    );
  }

  private async salvarNotificacaoPrazoProximo(
    usuarioId: number,
    tarefa: Pick<Tarefa, "id" | "titulo" | "prazo" | "prioridade">,
    diasRestantes: number,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioId,
      TipoNotificacao.PRAZO_PROXIMO,
    );
    if (!canReceive) return null;

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.PRAZO_PROXIMO,
      titulo: "Prazo se aproximando",
      descricao: `A tarefa "${tarefa.titulo}" vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}`,
      detalhes: {
        prazo: tarefa.prazo,
        diasRestantes,
        prioridade: tarefa.prioridade,
      },
      prioridade:
        diasRestantes <= 1
          ? PrioridadeNotificacao.ALTA
          : PrioridadeNotificacao.MEDIA,
      usuarioId,
      tarefaId: tarefa.id,
      link: `/tarefas/${tarefa.id}`,
    });

    return this.saveAndEmit(notificacao);
  }

  private async salvarNotificacaoTarefaAtrasada(
    usuarioId: number,
    tarefa: Pick<Tarefa, "id" | "titulo" | "prazo" | "prioridade">,
    diasAtrasados: number,
  ): Promise<Notificacao | null> {
    // Verificar preferências antes de criar
    const canReceive = await this.checkUserPreferences(
      usuarioId,
      TipoNotificacao.TAREFA_ATRASADA,
    );
    if (!canReceive) return null;

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_ATRASADA,
      titulo: "Tarefa atrasada",
      descricao: `A tarefa "${tarefa.titulo}" está atrasada há ${diasAtrasados} ${diasAtrasados === 1 ? "dia" : "dias"}`,
      detalhes: {
        prazo: tarefa.prazo,
        diasAtrasados,
        prioridade: tarefa.prioridade,
      },
      prioridade: PrioridadeNotificacao.CRITICA,
      usuarioId,
      tarefaId: tarefa.id,
      link: `/tarefas/${tarefa.id}`,
    });

    return this.saveAndEmit(notificacao);
  }

  async verificarTarefasComPrazoProximo(): Promise<Notificacao[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const doisDiasDepois = new Date(hoje);
    doisDiasDepois.setDate(doisDiasDepois.getDate() + 2);

    const tarefas = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .select([
        "tarefa.id",
        "tarefa.titulo",
        "tarefa.prazo",
        "tarefa.prioridade",
        "tarefa.responsavelId",
      ])
      .where("tarefa.prazo >= :hoje", { hoje })
      .andWhere("tarefa.prazo <= :doisDias", { doisDias: doisDiasDepois })
      .andWhere("tarefa.deletedAt IS NULL")
      .andWhere("tarefa.responsavelId IS NOT NULL")
      .getMany();

    if (tarefas.length === 0) {
      return [];
    }

    // Buscar notificações existentes nas últimas 24h (independente de lida)
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const tarefaIds = tarefas.map((t) => t.id);
    const notificacoesExistentes = await this.notificacaoRepository
      .createQueryBuilder("n")
      .select("n.tarefaId")
      .where("n.tipo = :tipo", { tipo: TipoNotificacao.PRAZO_PROXIMO })
      .andWhere("n.tarefaId IN (:...ids)", { ids: tarefaIds })
      .andWhere("n.createdAt > :umDiaAtras", { umDiaAtras })
      .getRawMany();

    const tarefasComNotificacao = new Set(
      notificacoesExistentes.map((n) => n.n_tarefaId),
    );

    const notificacoesPromises: Promise<Notificacao | null>[] = [];

    for (const tarefa of tarefas) {
      if (tarefasComNotificacao.has(tarefa.id)) continue;

      const diasRestantes = Math.ceil(
        (new Date(tarefa.prazo).getTime() - hoje.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      notificacoesPromises.push(
        this.salvarNotificacaoPrazoProximo(
          tarefa.responsavelId,
          tarefa,
          diasRestantes,
        ),
      );
    }

    const results = await Promise.all(notificacoesPromises);
    return results.filter((n): n is Notificacao => n !== null);
  }

  async verificarTarefasAtrasadas(): Promise<Notificacao[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const tarefas = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .select([
        "tarefa.id",
        "tarefa.titulo",
        "tarefa.prazo",
        "tarefa.prioridade",
        "tarefa.responsavelId",
      ])
      .where("tarefa.prazo < :hoje", { hoje })
      .andWhere("tarefa.deletedAt IS NULL")
      .andWhere("tarefa.responsavelId IS NOT NULL")
      .getMany();

    if (tarefas.length === 0) {
      return [];
    }

    // Buscar notificações existentes de uma vez (últimas 24h)
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const tarefaIds = tarefas.map((t) => t.id);
    const notificacoesExistentes = await this.notificacaoRepository
      .createQueryBuilder("n")
      .select("n.tarefaId")
      .where("n.tipo = :tipo", { tipo: TipoNotificacao.TAREFA_ATRASADA })
      .andWhere("n.tarefaId IN (:...ids)", { ids: tarefaIds })
      .andWhere("n.createdAt > :umDiaAtras", { umDiaAtras })
      .getRawMany();

    const tarefasComNotificacao = new Set(
      notificacoesExistentes.map((n) => n.n_tarefaId),
    );

    const notificacoesPromises: Promise<Notificacao | null>[] = [];

    for (const tarefa of tarefas) {
      if (tarefasComNotificacao.has(tarefa.id)) continue;

      const diasAtrasados = Math.floor(
        (hoje.getTime() - new Date(tarefa.prazo).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      notificacoesPromises.push(
        this.salvarNotificacaoTarefaAtrasada(
          tarefa.responsavelId,
          tarefa,
          diasAtrasados,
        ),
      );
    }

    const results = await Promise.all(notificacoesPromises);
    return results.filter((n): n is Notificacao => n !== null);
  }

  private async getAdministradoresIds(
    excludeIds: number[] = [],
  ): Promise<number[]> {
    const qb = this.userRepository
      .createQueryBuilder("usuario")
      .leftJoin("usuario.role", "role")
      .where("usuario.deletedAt IS NULL")
      .andWhere("LOWER(role.name) = :role", { role: "admin" });

    if (excludeIds.length > 0) {
      qb.andWhere("usuario.id NOT IN (:...excludeIds)", { excludeIds });
    }

    const administradores = await qb.getMany();
    return administradores.map((admin) => admin.id);
  }

  async notificarNovoRegistro(
    autorId: number | null,
    registroId?: string,
    resumo?: {
      numeroProcesso?: string;
      delegacia?: string;
      totalImportado?: number;
    },
  ): Promise<void> {
    const destinatarios = await this.getAdministradoresIds(
      autorId ? [autorId] : [],
    );

    if (!destinatarios.length) {
      return;
    }

    const autor = autorId
      ? await this.userRepository.findOne({ where: { id: autorId } })
      : null;

    const descricaoBase = autor
      ? `${autor.nome} adicionou um novo registro ao sistema.`
      : "Um novo registro foi adicionado ao sistema.";

    await Promise.all(
      destinatarios.map((usuarioId) =>
        this.create({
          tipo: TipoNotificacao.NOVO_REGISTRO,
          titulo: "Novo registro cadastrado",
          descricao: descricaoBase,
          detalhes: {
            registroId,
            ...resumo,
          },
          prioridade: PrioridadeNotificacao.MEDIA,
          usuarioId,
          link: "/registros",
        }),
      ),
    );
  }

  async notificarPastaCriada(
    autorId: number | null,
    pastaId: string,
    nomePasta: string,
  ): Promise<void> {
    const destinatarios = await this.getAdministradoresIds(
      autorId ? [autorId] : [],
    );

    if (!destinatarios.length) {
      return;
    }

    const autor = autorId
      ? await this.userRepository.findOne({
          where: { id: autorId },
        })
      : null;

    const descricao = autor
      ? `${autor.nome} criou a prateleira "${nomePasta}".`
      : `Uma nova prateleira "${nomePasta}" foi criada.`;

    await Promise.all(
      destinatarios.map((usuarioId) =>
        this.create({
          tipo: TipoNotificacao.PASTA_CRIADA,
          titulo: "Nova prateleira cadastrada",
          descricao,
          detalhes: {
            pastaId,
            nome: nomePasta,
          },
          prioridade: PrioridadeNotificacao.MEDIA,
          usuarioId,
          link: `/arquivo/${pastaId}`,
        }),
      ),
    );
  }

  async notificarEventoAuditoria(
    autorId: number,
    entidade: string,
    acao: string,
    entityId?: number | string,
    detalhesExtras?: Record<string, any>,
  ): Promise<void> {
    const destinatarios = await this.getAdministradoresIds([autorId]);

    if (!destinatarios.length) {
      return;
    }

    const autor = await this.userRepository.findOne({
      where: { id: autorId },
    });

    const acaoNormalizada = acao.toLowerCase();
    const descricao = autor
      ? `${autor.nome} realizou a ação ${acaoNormalizada} em ${entidade}.`
      : `Uma ação ${acaoNormalizada} foi registrada em ${entidade}.`;

    const detalhes = {
      entidade,
      acao,
      entityId,
      ...detalhesExtras,
    };

    await Promise.all(
      destinatarios.map((usuarioId) =>
        this.create({
          tipo: TipoNotificacao.EVENTO_AUDITORIA,
          titulo: `Alteração em ${entidade}`,
          descricao,
          detalhes,
          prioridade: PrioridadeNotificacao.MEDIA,
          usuarioId,
          link: "/auditoria",
        }),
      ),
    );
  }

  private mapPrioridadeTarefaParaNotificacao(
    prioridade: string,
  ): PrioridadeNotificacao {
    switch (prioridade?.toLowerCase()) {
      case "critica":
        return PrioridadeNotificacao.CRITICA;
      case "alta":
        return PrioridadeNotificacao.ALTA;
      case "media":
        return PrioridadeNotificacao.MEDIA;
      case "baixa":
        return PrioridadeNotificacao.BAIXA;
      default:
        return PrioridadeNotificacao.MEDIA;
    }
  }

  /**
   * Remove notificações lidas com mais de X dias (soft-delete).
   * Notificações não lidas são preservadas independente da idade.
   * @param diasRetencao Número de dias para reter notificações lidas (padrão: 30)
   * @returns Número de notificações removidas
   */
  async limparNotificacoesAntigas(diasRetencao = 30): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasRetencao);

    const result = await this.notificacaoRepository
      .createQueryBuilder()
      .softDelete()
      .where("lida = :lida", { lida: true })
      .andWhere("deletedAt IS NULL")
      .andWhere("createdAt < :dataLimite", { dataLimite })
      .execute();

    if ((result.affected || 0) > 0) {
      await this.bumpReadCachesVersion();
    }

    return result.affected || 0;
  }
}
