import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";

import { User } from "./modules/users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "./modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "./modules/nugecid/domain/enums/status-desarquivamento.enum";
import { Tarefa } from "./modules/tarefas/entities/tarefa.entity";
import { Projeto } from "./modules/tarefas/entities/projeto.entity";
import { Pasta } from "./modules/pastas/entities/pasta.entity";
import { Vestigio } from "./modules/vestigios/entities/vestigio.entity";
import { Notificacao } from "./modules/notificacoes/entities/notificacao.entity";
import { PlanilhaControle } from "./modules/planilhas/entities/planilha-controle.entity";
import {
  CACHE_VERSION_INITIAL,
  CACHE_VERSION_KEYS,
} from "./common/constants/cache-version.constants";
import { RuntimeMetricsService } from "./modules/observability/runtime-metrics.service";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private static readonly DASHBOARD_CACHE_TTL_SECONDS = 30;
  private static readonly GLOBAL_SEARCH_CACHE_TTL_SECONDS = 20;
  private static readonly ROLES_WITH_FULL_DESARQUIVAMENTO_ACCESS = new Set([
    "admin",
    "nugecid_viewer",
    "nugecid_operator",
  ]);
  private static readonly ROLES_WITH_USERS_ACCESS = new Set([
    "admin",
    "coordenador",
  ]);
  private static readonly ROLES_WITH_ALL_PASTAS_ACCESS = new Set([
    "admin",
    "coordenador",
  ]);
  private static readonly ROLES_WITH_ALL_PROJECTS_ACCESS = new Set(["admin"]);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(Pasta)
    private readonly pastaRepository: Repository<Pasta>,
    @InjectRepository(Vestigio)
    private readonly vestigioRepository: Repository<Vestigio>,
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
    @InjectRepository(PlanilhaControle)
    private readonly planilhaControleRepository: Repository<PlanilhaControle>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Optional()
    private readonly runtimeMetricsService?: RuntimeMetricsService,
  ) {}

  async getDashboardData(user: any) {
    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.APP_DASHBOARD,
    );
    const cacheKey = `app:dashboard:v${cacheVersion}:${user?.id ?? "anon"}:${this.normalizeRoleName(
      user?.role?.name,
    )}`;
    const cached = await this.getFromCache<{
      stats: {
        total: number;
        doMes: number;
        daSemana: number;
        emPosse: number;
        urgentes: number;
      };
      ultimosDesarquivamentos: DesarquivamentoTypeOrmEntity[];
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Otimizado: usar Promise.all para executar queries em paralelo
    const [statsResult, ultimosDesarquivamentos] = await Promise.all([
      // Uma única query para todas as estatísticas
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .select("COUNT(*)", "total")
        .addSelect(
          `SUM(CASE WHEN d.createdAt >= :startOfMonth THEN 1 ELSE 0 END)`,
          "doMes",
        )
        .addSelect(
          `SUM(CASE WHEN d.createdAt >= :startOfWeek THEN 1 ELSE 0 END)`,
          "daSemana",
        )
        .addSelect(
          `SUM(CASE WHEN d.status = :statusDesarquivado THEN 1 ELSE 0 END)`,
          "emPosse",
        )
        .addSelect(
          `SUM(CASE WHEN d.urgente = true THEN 1 ELSE 0 END)`,
          "urgentes",
        )
        .where("d.deletedAt IS NULL")
        .setParameters({
          startOfMonth,
          startOfWeek,
          statusDesarquivado: StatusDesarquivamentoEnum.DESARQUIVADO,
        })
        .getRawOne(),

      // Últimos desarquivamentos
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .leftJoinAndSelect("d.criadoPor", "criadoPor")
        .where("d.deletedAt IS NULL")
        .andWhere(
          user.role?.name === "admin" ? "1=1" : "d.criadoPorId = :userId",
          { userId: user.id },
        )
        .orderBy("d.createdAt", "DESC")
        .take(5)
        .getMany(),
    ]);

    const result = {
      stats: {
        total: parseInt(statsResult.total, 10) || 0,
        doMes: parseInt(statsResult.doMes, 10) || 0,
        daSemana: parseInt(statsResult.daSemana, 10) || 0,
        emPosse: parseInt(statsResult.emPosse, 10) || 0,
        urgentes: parseInt(statsResult.urgentes, 10) || 0,
      },
      ultimosDesarquivamentos,
    };

    await this.setInCache(
      cacheKey,
      result,
      AppService.DASHBOARD_CACHE_TTL_SECONDS,
    );
    return result;
  }

  /**
   * Health check da aplicação
   */
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
  }

  // ---------------------------------------------------------------------------
  // Busca Global
  // ---------------------------------------------------------------------------

  /** Mapa de caracteres acentuados → sem acento usado pelo PostgreSQL translate(). */
  private static readonly ACCENTED_CHARS =
    "ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç";
  private static readonly UNACCENTED_CHARS =
    "AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc";

  /**
   * Normaliza texto de busca: remove acentos, converte para minúscula e
   * elimina espaços extras. Reutiliza a mesma lógica do
   * DesarquivamentoTypeOrmRepository.normalizeSearchText().
   */
  private normalizeSearchText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  /**
   * Gera expressão SQL que normaliza uma coluna para comparação
   * accent-insensitive: translate(lower(coalesce(col, '')), acentos, sem_acentos)
   */
  private accentInsensitiveCol(column: string): string {
    return (
      `translate(lower(coalesce(${column}, '')), ` +
      `'${AppService.ACCENTED_CHARS}', '${AppService.UNACCENTED_CHARS}')`
    );
  }

  private normalizeRoleName(value?: string): string {
    return (value || "").trim().toLowerCase();
  }

  private hasAnyRole(userRoles: string[], allowedRoles: Set<string>): boolean {
    return userRoles.some((role) => allowedRoles.has(role));
  }

  /**
   * Busca global no sistema — pesquisa em paralelo nas entidades principais
   * usando comparação accent-insensitive (translate + NFD) e paginação global.
   */
  async globalSearch(params: {
    query: string;
    types?: string[];
    limit?: number;
    offset?: number;
    currentUser: Pick<User, "id" | "role">;
  }): Promise<{
    results: Array<{
      id: number | string;
      type:
        | "desarquivamento"
        | "usuario"
        | "tarefa"
        | "projeto"
        | "pasta"
        | "vestigio"
        | "notificacao"
        | "planilha";
      title: string;
      subtitle?: string;
      description?: string;
      url: string;
      metadata?: Record<string, unknown>;
    }>;
    total: number;
    query: string;
    typesCounts: Record<string, number>;
  }> {
    const { query, types, limit = 20, offset = 0, currentUser } = params;

    // Validar query
    if (!currentUser?.id || !query || query.trim().length < 2) {
      return { results: [], total: 0, query: query || "", typesCounts: {} };
    }

    const currentUserId = currentUser.id;
    const currentUserRoles = [
      this.normalizeRoleName(currentUser.role?.name),
    ].filter(Boolean);
    const canViewAllDesarquivamentos = this.hasAnyRole(
      currentUserRoles,
      AppService.ROLES_WITH_FULL_DESARQUIVAMENTO_ACCESS,
    );
    const canSearchUsers = this.hasAnyRole(
      currentUserRoles,
      AppService.ROLES_WITH_USERS_ACCESS,
    );
    const canViewAllPastas = this.hasAnyRole(
      currentUserRoles,
      AppService.ROLES_WITH_ALL_PASTAS_ACCESS,
    );
    const canViewAllProjects = this.hasAnyRole(
      currentUserRoles,
      AppService.ROLES_WITH_ALL_PROJECTS_ACCESS,
    );

    const normalizedTerm = this.normalizeSearchText(query);
    const searchTerm = `%${normalizedTerm}%`;
    const encodedQuery = encodeURIComponent(query.trim());
    const globalSearchVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.APP_GLOBAL_SEARCH,
    );
    const typesNormalized = [...(types ?? [])]
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean)
      .sort();
    const searchCacheKey = [
      `app:globalsearch:v${globalSearchVersion}`,
      `u:${currentUserId}`,
      `r:${currentUserRoles.sort().join(",") || "none"}`,
      `q:${normalizedTerm}`,
      `t:${typesNormalized.join(",") || "all"}`,
      `l:${limit}`,
      `o:${offset}`,
    ].join("|");

    const cachedSearch = await this.getFromCache<{
      results: Array<{
        id: number | string;
        type:
          | "desarquivamento"
          | "usuario"
          | "tarefa"
          | "projeto"
          | "pasta"
          | "vestigio"
          | "notificacao"
          | "planilha";
        title: string;
        subtitle?: string;
        description?: string;
        url: string;
        metadata?: Record<string, unknown>;
      }>;
      total: number;
      query: string;
      typesCounts: Record<string, number>;
    }>(searchCacheKey);
    if (cachedSearch) {
      return cachedSearch;
    }

    // -------------------------------------------------------------------
    // Buscar cada tipo em paralelo.  Cada promise resolve para um array de
    // resultados parciais — coleta-se depois para paginar globalmente.
    // Usamos um limite alto por tipo (limit * 2) para ter material suficiente
    // para paginação global, sem trazer dados excessivos.
    // -------------------------------------------------------------------
    const perTypeLimit = Math.min(limit * 2, 50);

    type PartialResult = {
      id: number | string;
      type:
        | "desarquivamento"
        | "usuario"
        | "tarefa"
        | "projeto"
        | "pasta"
        | "vestigio"
        | "notificacao"
        | "planilha";
      title: string;
      subtitle?: string;
      description?: string;
      url: string;
      metadata?: Record<string, unknown>;
    };

    const promises: Promise<PartialResult[]>[] = [];

    // ---- Desarquivamentos ----
    if (!types || types.includes("desarquivamento")) {
      promises.push(
        (() => {
          const queryBuilder = this.desarquivamentoRepository
            .createQueryBuilder("des")
            .select([
              "des.id",
              "des.numeroSolicitacao",
              "des.tipoDesarquivamento",
              "des.nomeCompleto",
              "des.numeroNicLaudoAuto",
              "des.numeroProcesso",
              "des.status",
              "des.setorDemandante",
              "des.dataSolicitacao",
            ])
            .where("des.deletedAt IS NULL")
            .andWhere(
              `(${this.accentInsensitiveCol("des.nomeCompleto")} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol("des.numeroNicLaudoAuto")} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol("des.numeroProcesso")} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol("des.setorDemandante")} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol("des.servidorResponsavel")} LIKE :searchTerm)`,
              { searchTerm },
            );

          if (!canViewAllDesarquivamentos) {
            queryBuilder.andWhere(
              "(des.criadoPorId = :currentUserId OR des.responsavelId = :currentUserId)",
              { currentUserId },
            );
          }

          return queryBuilder
            .orderBy("des.createdAt", "DESC")
            .take(perTypeLimit)
            .getMany()
            .then((rows): PartialResult[] =>
              rows.map((des) => ({
                id: des.id,
                type: "desarquivamento" as const,
                title: `Solicitação #${des.numeroSolicitacao}`,
                subtitle: `${des.tipoDesarquivamento} - ${des.nomeCompleto}`,
                description: `NIC/Laudo/Auto: ${des.numeroNicLaudoAuto || "—"} | Processo: ${des.numeroProcesso || "—"}`,
                url: `/desarquivamentos/${des.id}`,
                metadata: {
                  status: des.status,
                  setor: des.setorDemandante,
                  dataSolicitacao: des.dataSolicitacao,
                },
              })),
            )
            .catch((error) => {
              this.logger.error(
                "Erro ao buscar desarquivamentos:",
                error.message,
              );
              return [] as PartialResult[];
            });
        })(),
      );
    }

    // ---- Usuários ----
    if ((!types || types.includes("usuario")) && canSearchUsers) {
      promises.push(
        this.userRepository
          .createQueryBuilder("user")
          .leftJoinAndSelect("user.role", "role")
          .select(["user.id", "user.nome", "user.usuario", "role.name"])
          .where("user.ativo = :ativo", { ativo: true })
          .andWhere(
            `(${this.accentInsensitiveCol('"user"."nome"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"user"."usuario"')} LIKE :searchTerm)`,
            { searchTerm },
          )
          .take(perTypeLimit)
          .getMany()
          .then((rows): PartialResult[] =>
            rows.map((user) => ({
              id: user.id,
              type: "usuario" as const,
              title: user.nome,
              subtitle: user.usuario,
              description: user.role?.name || "Usuário",
              url: `/usuarios/${user.id}/editar`,
              metadata: { role: user.role?.name },
            })),
          )
          .catch((error) => {
            this.logger.error("Erro ao buscar usuários:", error.message);
            return [] as PartialResult[];
          }),
      );
    }

    // ---- Tarefas ----
    if (!types || types.includes("tarefa")) {
      promises.push(
        this.tarefaRepository
          .createQueryBuilder("tarefa")
          .leftJoin("tarefa.responsavel", "responsavel")
          .leftJoin("tarefa.projeto", "projeto")
          .leftJoin("projeto.membros", "membro")
          .select([
            "tarefa.id",
            "tarefa.titulo",
            "tarefa.descricao",
            "tarefa.prioridade",
            "tarefa.prazo",
            "tarefa.createdAt",
            "responsavel.nome",
            "projeto.nome",
          ])
          .where(
            `(${this.accentInsensitiveCol('"tarefa"."titulo"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"tarefa"."descricao"')} LIKE :searchTerm)`,
            { searchTerm },
          )
          .andWhere(
            new Brackets((qb) => {
              qb.where("projeto.criadorId = :currentUserId", {
                currentUserId,
              }).orWhere("membro.usuarioId = :currentUserId", {
                currentUserId,
              });
            }),
          )
          .distinct(true)
          .orderBy("tarefa.createdAt", "DESC")
          .take(perTypeLimit)
          .getMany()
          .then((rows): PartialResult[] =>
            rows.map((tarefa) => ({
              id: tarefa.id,
              type: "tarefa" as const,
              title: tarefa.titulo,
              subtitle: tarefa.projeto?.nome || "Sem projeto",
              description: tarefa.descricao?.substring(0, 100) || "",
              url: `/tarefas/${tarefa.id}`,
              metadata: {
                prioridade: tarefa.prioridade,
                responsavel: tarefa.responsavel?.nome,
                prazo: tarefa.prazo,
              },
            })),
          )
          .catch((error) => {
            this.logger.error("Erro ao buscar tarefas:", error.message);
            return [] as PartialResult[];
          }),
      );
    }

    // ---- Projetos ----
    if (!types || types.includes("projeto")) {
      promises.push(
        (() => {
          const queryBuilder = this.projetoRepository
            .createQueryBuilder("projeto")
            .leftJoin("projeto.criador", "criador")
            .leftJoin("projeto.membros", "membro")
            .select([
              "projeto.id",
              "projeto.nome",
              "projeto.descricao",
              "projeto.createdAt",
              "criador.nome",
            ])
            .where(
              `(${this.accentInsensitiveCol('"projeto"."nome"')} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol('"projeto"."descricao"')} LIKE :searchTerm)`,
              { searchTerm },
            );

          if (!canViewAllProjects) {
            queryBuilder.andWhere(
              new Brackets((qb) => {
                qb.where("projeto.criadorId = :currentUserId", {
                  currentUserId,
                }).orWhere("membro.usuarioId = :currentUserId", {
                  currentUserId,
                });
              }),
            );
          }

          return queryBuilder
            .distinct(true)
            .orderBy("projeto.createdAt", "DESC")
            .take(perTypeLimit)
            .getMany()
            .then((rows): PartialResult[] =>
              rows.map((projeto) => ({
                id: projeto.id,
                type: "projeto" as const,
                title: projeto.nome,
                subtitle: `Criado por ${projeto.criador?.nome || "Desconhecido"}`,
                description: projeto.descricao?.substring(0, 100) || "",
                url: `/projetos/${projeto.id}`,
                metadata: { dataCriacao: projeto.createdAt },
              })),
            )
            .catch((error) => {
              this.logger.error("Erro ao buscar projetos:", error.message);
              return [] as PartialResult[];
            });
        })(),
      );
    }

    // ---- Pastas (Arquivo) ----
    if (!types || types.includes("pasta")) {
      promises.push(
        (() => {
          const queryBuilder = this.pastaRepository
            .createQueryBuilder("pasta")
            .select([
              "pasta.id",
              "pasta.nome",
              "pasta.descricao",
              "pasta.tags",
              "pasta.imagens",
              "pasta.planilhas",
            ])
            .where(
              `(${this.accentInsensitiveCol('"pasta"."nome"')} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol('"pasta"."descricao"')} LIKE :searchTerm OR ` +
                `${this.accentInsensitiveCol('"pasta"."tags"')} LIKE :searchTerm)`,
              { searchTerm },
            );

          if (!canViewAllPastas) {
            queryBuilder.andWhere("pasta.criadoPorId = :currentUserId", {
              currentUserId,
            });
          }

          return queryBuilder
            .orderBy("pasta.nome", "ASC")
            .take(perTypeLimit)
            .getMany()
            .then((rows): PartialResult[] =>
              rows.map((pasta) => ({
                id: pasta.id,
                type: "pasta" as const,
                title: pasta.nome,
                subtitle: pasta.tags?.join(", ") || "",
                description: pasta.descricao || "",
                url: `/arquivo/${pasta.id}`,
                metadata: {
                  imagens: pasta.imagens,
                  planilhas: pasta.planilhas,
                  descricao: pasta.descricao,
                },
              })),
            )
            .catch((error) => {
              this.logger.error("Erro ao buscar pastas:", error.message);
              return [] as PartialResult[];
            });
        })(),
      );
    }

    // ---- Vestígios ----
    if (!types || types.includes("vestigio")) {
      promises.push(
        this.vestigioRepository
          .createQueryBuilder("vestigio")
          .select([
            "vestigio.id",
            "vestigio.codigoScv",
            "vestigio.numeroVestigio",
            "vestigio.numeroCaso",
            "vestigio.categoria",
            "vestigio.delegacia",
            "vestigio.status",
            "vestigio.createdAt",
          ])
          .where(
            `(${this.accentInsensitiveCol('"vestigio"."codigo_scv"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"vestigio"."numero_vestigio"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"vestigio"."numero_caso"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"vestigio"."categoria"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"vestigio"."delegacia"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"vestigio"."etiqueta_completa"')} LIKE :searchTerm)`,
            { searchTerm },
          )
          .orderBy("vestigio.createdAt", "DESC")
          .take(perTypeLimit)
          .getMany()
          .then((rows): PartialResult[] =>
            rows.map((vestigio) => ({
              id: vestigio.id,
              type: "vestigio" as const,
              title: vestigio.codigoScv || "Vestígio sem código",
              subtitle: `Vestígio: ${vestigio.numeroVestigio || "—"} | Caso: ${vestigio.numeroCaso || "—"}`,
              description: `${vestigio.categoria || "Sem categoria"} | ${vestigio.delegacia || "Sem delegacia"}`,
              url: `/custodia/banco-vestigios?vestigioId=${vestigio.id}&q=${encodedQuery}`,
              metadata: {
                status: vestigio.status,
                numeroVestigio: vestigio.numeroVestigio,
                numeroCaso: vestigio.numeroCaso,
              },
            })),
          )
          .catch((error) => {
            this.logger.error("Erro ao buscar vestígios:", error.message);
            return [] as PartialResult[];
          }),
      );
    }

    // ---- Notificações ----
    if (!types || types.includes("notificacao")) {
      promises.push(
        this.notificacaoRepository
          .createQueryBuilder("notificacao")
          .select([
            "notificacao.id",
            "notificacao.titulo",
            "notificacao.descricao",
            "notificacao.tipo",
            "notificacao.prioridade",
            "notificacao.lida",
            "notificacao.createdAt",
          ])
          .where("notificacao.usuarioId = :currentUserId", { currentUserId })
          .andWhere("notificacao.deletedAt IS NULL")
          .andWhere(
            `(${this.accentInsensitiveCol('"notificacao"."titulo"')} LIKE :searchTerm OR ` +
              `${this.accentInsensitiveCol('"notificacao"."descricao"')} LIKE :searchTerm)`,
            { searchTerm },
          )
          .orderBy("notificacao.createdAt", "DESC")
          .take(perTypeLimit)
          .getMany()
          .then((rows): PartialResult[] =>
            rows.map((notificacao) => ({
              id: notificacao.id,
              type: "notificacao" as const,
              title: notificacao.titulo,
              subtitle: `${notificacao.tipo} | ${notificacao.lida ? "Lida" : "Não lida"}`,
              description: notificacao.descricao?.substring(0, 120) || "",
              url: `/notificacoes?notificacaoId=${notificacao.id}`,
              metadata: {
                prioridade: notificacao.prioridade,
                tipo: notificacao.tipo,
                lida: notificacao.lida,
              },
            })),
          )
          .catch((error) => {
            this.logger.error("Erro ao buscar notificações:", error.message);
            return [] as PartialResult[];
          }),
      );
    }

    // ---- Planilhas de Controle ----
    if (!types || types.includes("planilha")) {
      promises.push(
        this.planilhaControleRepository
          .createQueryBuilder("planilha")
          .select([
            "planilha.id",
            "planilha.nomeOriginal",
            "planilha.tamanhoBytes",
            "planilha.dataUpload",
          ])
          .where(
            `${this.accentInsensitiveCol('"planilha"."nome_original"')} LIKE :searchTerm`,
            { searchTerm },
          )
          .orderBy("planilha.dataUpload", "DESC")
          .take(perTypeLimit)
          .getMany()
          .then((rows): PartialResult[] =>
            rows.map((planilha) => ({
              id: planilha.id,
              type: "planilha" as const,
              title: planilha.nomeOriginal || "Planilha sem nome",
              subtitle: `Upload: ${planilha.dataUpload ? new Date(planilha.dataUpload).toISOString().slice(0, 10) : "Data desconhecida"}`,
              description: `Tamanho: ${planilha.tamanhoBytes || "0"} bytes`,
              url: `/arquivo?tab=planilhas&planilhaId=${planilha.id}&q=${encodedQuery}`,
              metadata: {
                tamanhoBytes: planilha.tamanhoBytes,
                dataUpload: planilha.dataUpload,
              },
            })),
          )
          .catch((error) => {
            this.logger.error("Erro ao buscar planilhas:", error.message);
            return [] as PartialResult[];
          }),
      );
    }

    // -------------------------------------------------------------------
    // Agregar resultados de todas as entidades
    // -------------------------------------------------------------------
    const settled = await Promise.all(promises);
    const allResults = settled.flat();

    // Contagem por tipo
    const typesCounts: Record<string, number> = {};
    for (const r of allResults) {
      typesCounts[r.type] = (typesCounts[r.type] || 0) + 1;
    }

    // Ordenação por relevância: match exato no título primeiro, depois título
    // contém o termo, depois os demais.
    allResults.sort((a, b) => {
      const aLower = this.normalizeSearchText(a.title);
      const bLower = this.normalizeSearchText(b.title);
      const aExact =
        aLower === normalizedTerm ? 2 : aLower.includes(normalizedTerm) ? 1 : 0;
      const bExact =
        bLower === normalizedTerm ? 2 : bLower.includes(normalizedTerm) ? 1 : 0;
      return bExact - aExact;
    });

    // Paginação global
    const total = allResults.length;
    const paged = allResults.slice(offset, offset + limit);

    const result = { results: paged, total, query, typesCounts };
    await this.setInCache(
      searchCacheKey,
      result,
      AppService.GLOBAL_SEARCH_CACHE_TTL_SECONDS,
    );
    return result;
  }

  private async getFromCache<T>(key: string): Promise<T | undefined> {
    const namespace = "app";
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

  private async getCacheVersion(versionKey: string): Promise<number> {
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

  private async setInCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    const namespace = "app";
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
}
