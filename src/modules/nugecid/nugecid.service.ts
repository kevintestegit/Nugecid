import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  Optional,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";

import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import { DesarquivamentoCommentTypeOrmEntity } from "./infrastructure/entities/desarquivamento-comment.typeorm-entity";
import { TipoDesarquivamentoEnum } from "./domain/enums/tipo-desarquivamento.enum";
import { User } from "../users/entities/user.entity";
import { CreateDesarquivamentoDto } from "./dto/create-desarquivamento.dto";
import { UpdateDesarquivamentoDto } from "./dto/update-desarquivamento.dto";
import { QueryDesarquivamentoDto } from "./dto/query-desarquivamento.dto";
import { StatusDesarquivamentoEnum } from "./domain/enums/status-desarquivamento.enum";

export interface PaginatedDesarquivamentos {
  desarquivamentos: DesarquivamentoTypeOrmEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidos: number;
  vencidos: number;
  porStatus: { status: string; count: number; color: string }[];
  porTipo: { tipo: string; count: number }[];
  recentes: DesarquivamentoTypeOrmEntity[];
}

export interface CreateDesarquivamentoOptions {
  manager?: EntityManager;
  skipAudit?: boolean;
  skipNotifications?: boolean;
}

import { NugecidAuditService } from "./nugecid-audit.service";
import {
  NotificacoesService,
  CreateNotificacaoDto,
} from "../notificacoes/services/notificacoes.service";
import {
  TipoNotificacao,
  PrioridadeNotificacao,
} from "../notificacoes/entities/notificacao.entity";
import {
  CACHE_VERSION_INITIAL,
  CACHE_VERSION_KEYS,
} from "../../common/constants/cache-version.constants";
import { RuntimeMetricsService } from "../observability/runtime-metrics.service";

@Injectable()
export class NugecidService {
  private readonly logger = new Logger(NugecidService.name);
  private static readonly LIST_CACHE_TTL_SECONDS = 20;

  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    @InjectRepository(DesarquivamentoCommentTypeOrmEntity)
    private readonly commentRepository: Repository<DesarquivamentoCommentTypeOrmEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly nugecidAuditService: NugecidAuditService,
    private readonly notificacoesService: NotificacoesService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
    @Optional()
    private readonly runtimeMetricsService?: RuntimeMetricsService,
  ) {}

  /**
   * Cria novo desarquivamento
   */
  async create(
    createDesarquivamentoDto: CreateDesarquivamentoDto,
    currentUser: User,
    options: CreateDesarquivamentoOptions = {},
  ): Promise<DesarquivamentoTypeOrmEntity> {
    // numeroSolicitacao agora usa auto-increment do banco
    // Removido cálculo manual para evitar conflitos em importações

    // Mapeia tipoDesarquivamento para desarquivamentoFisicoDigital
    const tipoDesarq = this.normalizeTipoDesarquivamento(
      createDesarquivamentoDto.desarquivamentoFisicoDigital ??
        (createDesarquivamentoDto as any).tipoDesarquivamento,
    );

    const repository =
      options.manager?.getRepository(DesarquivamentoTypeOrmEntity) ??
      this.desarquivamentoRepository;

    const desarquivamento = repository.create({
      ...createDesarquivamentoDto,
      desarquivamentoFisicoDigital: tipoDesarq,
      tipoDesarquivamento: tipoDesarq,
      // numeroSolicitacao: REMOVIDO - usa auto-increment do banco
      criadoPorId: currentUser.id,
      status:
        (createDesarquivamentoDto as any).status ||
        StatusDesarquivamentoEnum.SOLICITADO,
    });

    const saved = await repository.save(desarquivamento);

    if (!options.skipAudit) {
      // Salva auditoria detalhada
      await this.nugecidAuditService.saveDesarquivamentoAudit(
        currentUser.id,
        "CREATE",
        saved,
        null, // sem mudanças na criação
      );
    }

    if (!options.skipNotifications) {
      // Criar notificação para coordenadores/administradores
      try {
        await this.criarNotificacaoNovoDesarquivamento(saved, currentUser);
      } catch (error) {
        this.logger.error(
          "Erro ao criar notificação de novo desarquivamento:",
          error,
        );
      }
    }

    this.logger.log(
      `Desarquivamento criado: ${saved.numeroNicLaudoAuto} por ${currentUser.usuario}`,
    );

    if (!options.manager) {
      await this.bumpPerformanceCacheVersions();
    }

    if (options.manager) {
      return saved;
    }

    return this.findOne(saved.id);
  }

  /**
   * Lista desarquivamentos com paginação e filtros
   */
  async findAll(
    queryDto: QueryDesarquivamentoDto,
  ): Promise<PaginatedDesarquivamentos> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = queryDto;
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Math.min(100, Number(limit) || 10));

    const validSortFields = [
      "dataSolicitacao",
      "nomeCompleto",
      "numeroNicLaudoAuto",
      "numeroProcesso",
      "status",
      "desarquivamentoFisicoDigital",
      "setorDemandante",
      "servidorResponsavel",
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : "dataSolicitacao";
    const sortDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.NUGECID_LIST,
    );
    const cacheKey = this.buildListCacheKey(
      "active",
      queryDto,
      pageNumber,
      limitNumber,
      sortField,
      sortDirection,
      cacheVersion,
    );
    const cached = await this.getFromCache<PaginatedDesarquivamentos>(cacheKey);
    if (cached) {
      return cached;
    }

    const dataQueryBuilder = this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .leftJoinAndSelect("desarquivamento.criadoPor", "criadoPor")
      .leftJoinAndSelect("desarquivamento.responsavel", "responsavel");

    this.applyFilters(dataQueryBuilder, queryDto);

    dataQueryBuilder.orderBy(`desarquivamento.${sortField}`, sortDirection);
    if (typeof dataQueryBuilder.addOrderBy === "function") {
      dataQueryBuilder.addOrderBy("desarquivamento.id", "DESC");
    }

    const offset = (pageNumber - 1) * limitNumber;
    dataQueryBuilder.skip(offset).take(limitNumber);

    const countQueryBuilder =
      this.desarquivamentoRepository.createQueryBuilder("desarquivamento");
    this.applyFilters(countQueryBuilder, queryDto);

    const [desarquivamentos, total] = await this.executePaginatedQuery(
      dataQueryBuilder,
      countQueryBuilder,
    );
    const totalPages = Math.ceil(total / limitNumber);

    const result = {
      desarquivamentos,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages,
    };

    await this.setInCache(
      cacheKey,
      result,
      NugecidService.LIST_CACHE_TTL_SECONDS,
    );

    return result;
  }

  private applyFilters(
    queryBuilder: any,
    queryDto: QueryDesarquivamentoDto,
  ): void {
    const {
      search,
      status,
      tipoDesarquivamento,
      usuarioId,
      responsavelId,
      dataInicio,
      dataFim,
      startDate,
      endDate,
      vencidos,
      urgente,
      instituto,
      requerente,
    } = queryDto;

    if (search) {
      queryBuilder.andWhere(
        "(desarquivamento.nomeCompleto ILIKE :search OR " +
          "desarquivamento.numeroNicLaudoAuto ILIKE :search OR " +
          "desarquivamento.numeroProcesso ILIKE :search OR " +
          "desarquivamento.setorDemandante ILIKE :search OR " +
          "desarquivamento.servidorResponsavel ILIKE :search OR " +
          "desarquivamento.tipoDocumento ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (status && status.length > 0) {
      queryBuilder.andWhere("desarquivamento.status IN (:...status)", {
        status,
      });
    }

    if (tipoDesarquivamento && tipoDesarquivamento.length > 0) {
      queryBuilder.andWhere(
        "desarquivamento.desarquivamentoFisicoDigital IN (:...tipoDesarquivamento)",
        { tipoDesarquivamento },
      );
    }

    if (usuarioId) {
      queryBuilder.andWhere("desarquivamento.criadoPorId = :usuarioId", {
        usuarioId,
      });
    }

    if (responsavelId) {
      queryBuilder.andWhere("desarquivamento.responsavelId = :responsavelId", {
        responsavelId,
      });
    }

    if (dataInicio) {
      queryBuilder.andWhere("desarquivamento.createdAt >= :dataInicio", {
        dataInicio: new Date(dataInicio),
      });
    }

    if (dataFim) {
      queryBuilder.andWhere("desarquivamento.createdAt <= :dataFim", {
        dataFim: new Date(dataFim),
      });
    }

    if (startDate) {
      queryBuilder.andWhere("desarquivamento.dataSolicitacao >= :startDate", {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere("desarquivamento.dataSolicitacao <= :endDate", {
        endDate: new Date(endDate),
      });
    }

    if (vencidos) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryBuilder.andWhere(
        "desarquivamento.dataSolicitacao < :thirtyDaysAgo",
        {
          thirtyDaysAgo,
        },
      );
      queryBuilder.andWhere("desarquivamento.status != :finalizado", {
        finalizado: StatusDesarquivamentoEnum.FINALIZADO,
      });
    }

    if (urgente !== undefined) {
      queryBuilder.andWhere("desarquivamento.urgente = :urgente", {
        urgente,
      });
    }

    if (instituto) {
      queryBuilder.andWhere("desarquivamento.instituto = :instituto", {
        instituto,
      });
    }

    if (requerente) {
      queryBuilder.andWhere("desarquivamento.requerente ILIKE :requerente", {
        requerente: `%${requerente}%`,
      });
    }
  }

  private normalizeTipoDesarquivamento(
    value?: string | TipoDesarquivamentoEnum,
  ): TipoDesarquivamentoEnum {
    if (!value) {
      return TipoDesarquivamentoEnum.FISICO;
    }

    const normalized = value
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (
      Object.values(TipoDesarquivamentoEnum).includes(
        normalized as TipoDesarquivamentoEnum,
      )
    ) {
      return normalized as TipoDesarquivamentoEnum;
    }

    this.logger.warn(
      `Tipo de desarquivamento inválido "${value}" recebido; aplicando FISICO como padrão.`,
    );
    return TipoDesarquivamentoEnum.FISICO;
  }

  private async ensureExists(
    id: number,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    const found = await this.desarquivamentoRepository.findOne({
      where: { id },
    });
    if (!found) {
      throw new NotFoundException(
        `Desarquivamento com ID ${id} não encontrado.`,
      );
    }
    return found;
  }

  async listComments(
    desarquivamentoId: number,
  ): Promise<DesarquivamentoCommentTypeOrmEntity[]> {
    await this.ensureExists(desarquivamentoId);
    return this.commentRepository.find({
      where: { desarquivamentoId },
      order: { createdAt: "DESC" },
    });
  }

  async addComment(
    desarquivamentoId: number,
    user: User,
    comment: string,
  ): Promise<DesarquivamentoCommentTypeOrmEntity> {
    if (!comment || !comment.trim()) {
      throw new BadRequestException("O comentário não pode ser vazio.");
    }

    await this.ensureExists(desarquivamentoId);

    const entity = this.commentRepository.create({
      desarquivamentoId,
      userId: user?.id ?? null,
      authorName: user?.nome || user?.usuario || "Usuário",
      comment: comment.trim(),
    });

    return this.commentRepository.save(entity);
  }

  /**
   * Busca desarquivamento por ID
   */
  async findOne(id: number): Promise<DesarquivamentoTypeOrmEntity> {
    const desarquivamento = await this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .leftJoinAndSelect("desarquivamento.criadoPor", "criadoPor")
      .leftJoinAndSelect("desarquivamento.responsavel", "responsavel")
      .where("desarquivamento.id = :id", { id })
      .getOne();

    if (!desarquivamento) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    return desarquivamento;
  }

  /**
   * Busca desarquivamento por código de barras
   */
  async findByBarcode(
    numeroNicLaudoAuto: string,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where: { numeroNicLaudoAuto },
      relations: ["usuario", "responsavel"],
    });

    if (!desarquivamento) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    return desarquivamento;
  }

  /**
   * Busca registros relacionados pelo mesmo número de processo
   */
  async findRelatedByProcess(
    id: number,
  ): Promise<DesarquivamentoTypeOrmEntity[]> {
    const desarquivamento = await this.findOne(id);
    const numeroProcesso = desarquivamento.numeroProcesso;

    if (!numeroProcesso) {
      return [desarquivamento];
    }

    const related = await this.desarquivamentoRepository.find({
      where: {
        numeroProcesso,
        deletedAt: null, // Apenas registros ativos
      },
      relations: ["criadoPor", "responsavel"],
      order: {
        createdAt: "ASC", // Ordem de criação para manter consistência
      },
    });

    return related;
  }

  /**
   * Atualiza desarquivamento
   */
  async update(
    id: number,
    updateDesarquivamentoDto: UpdateDesarquivamentoDto,
    currentUser: User,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    const desarquivamento = await this.findOne(id);

    // Verifica permissões - apenas admin ou criador pode editar
    if (
      !currentUser.isAdmin() &&
      desarquivamento.criadoPorId !== currentUser.id
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para editar este desarquivamento",
      );
    }

    // Mapeia tipoDesarquivamento para desarquivamentoFisicoDigital se presente
    if ((updateDesarquivamentoDto as any).tipoDesarquivamento) {
      (updateDesarquivamentoDto as any).desarquivamentoFisicoDigital = (
        updateDesarquivamentoDto as any
      ).tipoDesarquivamento;
    }

    // Atualiza os campos
    Object.assign(desarquivamento, updateDesarquivamentoDto);

    // Se mudou o responsável, atualiza
    if (updateDesarquivamentoDto.responsavelId) {
      const responsavel = await this.userRepository.findOne({
        where: { id: updateDesarquivamentoDto.responsavelId },
      });
      if (!responsavel) {
        throw new BadRequestException("Responsável não encontrado");
      }
      desarquivamento.responsavelId = responsavel.id;
    }

    const updated = await this.desarquivamentoRepository.save(desarquivamento);

    // Salva auditoria detalhada
    await this.nugecidAuditService.saveDesarquivamentoAudit(
      currentUser.id,
      "UPDATE",
      updated,
      updateDesarquivamentoDto,
    );

    this.logger.log(
      `Desarquivamento atualizado: ${updated.numeroNicLaudoAuto} por ${currentUser.usuario}`,
    );

    await this.bumpPerformanceCacheVersions();

    return this.findOne(updated.id);
  }

  /**
   * Remove desarquivamento (soft delete)
   */
  async remove(id: number, currentUser: User): Promise<void> {
    const desarquivamento = await this.findOne(id);

    // Verifica permissões - apenas admin ou criador pode deletar
    if (
      !currentUser.isAdmin() &&
      desarquivamento.criadoPorId !== currentUser.id
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para remover este desarquivamento",
      );
    }

    const result = await this.desarquivamentoRepository.softDelete(id);

    if (result.affected === 0) {
      this.logger.warn(
        `Tentativa de soft delete sem efeito para o ID: ${id}. O registro pode não ter sido encontrado.`,
      );
      throw new NotFoundException(
        `Desarquivamento com ID ${id} não encontrado para remoção.`,
      );
    }

    // Salva auditoria
    await this.nugecidAuditService.saveAudit(
      currentUser.id,
      "DELETE",
      "DESARQUIVAMENTO",
      `Desarquivamento removido: ${desarquivamento.numeroNicLaudoAuto}`,
      { desarquivamentoId: desarquivamento.id },
    );

    this.logger.log(
      `Desarquivamento removido: ${desarquivamento.numeroNicLaudoAuto} por ${currentUser.usuario}`,
    );

    await this.bumpPerformanceCacheVersions();
  }

  /**
   * Lista desarquivamentos removidos (lixeira)
   */
  async findAllDeleted(
    queryDto: QueryDesarquivamentoDto,
  ): Promise<PaginatedDesarquivamentos> {
    const {
      page = 1,
      limit = 10,
      sortBy = "deletedAt",
      sortOrder = "DESC",
    } = queryDto;
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Math.min(100, Number(limit) || 10));

    const validSortFields = ["deletedAt", "nomeCompleto", "numeroNicLaudoAuto"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "deletedAt";
    const sortDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.NUGECID_LIST,
    );
    const cacheKey = this.buildListCacheKey(
      "deleted",
      queryDto,
      pageNumber,
      limitNumber,
      sortField,
      sortDirection,
      cacheVersion,
    );
    const cached = await this.getFromCache<PaginatedDesarquivamentos>(cacheKey);
    if (cached) {
      return cached;
    }

    const dataQueryBuilder = this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .withDeleted() // Adicionado para incluir os soft-deleted
      .where("desarquivamento.deletedAt IS NOT NULL")
      .leftJoinAndSelect("desarquivamento.criadoPor", "criadoPor")
      .leftJoinAndSelect("desarquivamento.responsavel", "responsavel");

    this.applyFilters(dataQueryBuilder, queryDto);

    dataQueryBuilder.orderBy(`desarquivamento.${sortField}`, sortDirection);
    if (typeof dataQueryBuilder.addOrderBy === "function") {
      dataQueryBuilder.addOrderBy("desarquivamento.id", "DESC");
    }

    const offset = (pageNumber - 1) * limitNumber;
    dataQueryBuilder.skip(offset).take(limitNumber);

    const countQueryBuilder = this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .withDeleted()
      .where("desarquivamento.deletedAt IS NOT NULL");
    this.applyFilters(countQueryBuilder, queryDto);

    const [desarquivamentos, total] = await this.executePaginatedQuery(
      dataQueryBuilder,
      countQueryBuilder,
    );
    const totalPages = Math.ceil(total / limitNumber);

    const result = {
      desarquivamentos,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages,
    };

    await this.setInCache(
      cacheKey,
      result,
      NugecidService.LIST_CACHE_TTL_SECONDS,
    );

    return result;
  }

  /**
   * Restaura um desarquivamento removido (soft delete)
   */
  async restore(id: number, currentUser: User): Promise<void> {
    // Apenas admins podem restaurar
    if (!currentUser.isAdmin()) {
      throw new ForbiddenException(
        "Você não tem permissão para restaurar este desarquivamento",
      );
    }

    const restoreResult = await this.desarquivamentoRepository.restore(id);

    if (restoreResult.affected === 0) {
      throw new NotFoundException("Desarquivamento não encontrado na lixeira");
    }

    const desarquivamento = await this.findOne(id);

    // Salva auditoria
    await this.nugecidAuditService.saveAudit(
      currentUser.id,
      "RESTORE",
      "DESARQUIVamento",
      `Desarquivamento restaurado: ${desarquivamento.numeroNicLaudoAuto}`,
      { desarquivamentoId: id },
    );

    this.logger.log(
      `Desarquivamento restaurado: ${desarquivamento.numeroNicLaudoAuto} por ${currentUser.usuario}`,
    );

    await this.bumpPerformanceCacheVersions();
  }

  private async bumpPerformanceCacheVersions(): Promise<void> {
    await Promise.allSettled([
      this.bumpCacheVersion(CACHE_VERSION_KEYS.APP_DASHBOARD),
      this.bumpCacheVersion(CACHE_VERSION_KEYS.APP_GLOBAL_SEARCH),
      this.bumpCacheVersion(CACHE_VERSION_KEYS.ESTATISTICAS),
      this.bumpCacheVersion(CACHE_VERSION_KEYS.NUGECID_LIST),
    ]);
  }

  private async executePaginatedQuery(
    dataQueryBuilder: {
      getMany?: () => Promise<DesarquivamentoTypeOrmEntity[]>;
      getManyAndCount?: () => Promise<[DesarquivamentoTypeOrmEntity[], number]>;
    },
    countQueryBuilder: {
      getCount?: () => Promise<number>;
    },
  ): Promise<[DesarquivamentoTypeOrmEntity[], number]> {
    if (
      typeof dataQueryBuilder.getMany === "function" &&
      typeof countQueryBuilder.getCount === "function"
    ) {
      const [items, total] = await Promise.all([
        dataQueryBuilder.getMany(),
        countQueryBuilder.getCount(),
      ]);
      return [items, total];
    }

    if (typeof dataQueryBuilder.getManyAndCount === "function") {
      return dataQueryBuilder.getManyAndCount();
    }

    throw new Error("QueryBuilder incompatível: método de paginação ausente.");
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

  private buildListCacheKey(
    scope: "active" | "deleted",
    queryDto: QueryDesarquivamentoDto,
    page: number,
    limit: number,
    sortField: string,
    sortDirection: "ASC" | "DESC",
    version: number,
  ): string {
    const normalizedFilters = {
      search: queryDto.search?.trim().toLowerCase() || "",
      status: [...(queryDto.status ?? [])].sort(),
      tipoDesarquivamento: [...(queryDto.tipoDesarquivamento ?? [])].sort(),
      usuarioId: queryDto.usuarioId ?? null,
      responsavelId: queryDto.responsavelId ?? null,
      dataInicio: queryDto.dataInicio ?? null,
      dataFim: queryDto.dataFim ?? null,
      startDate: queryDto.startDate ?? null,
      endDate: queryDto.endDate ?? null,
      vencidos: Boolean(queryDto.vencidos),
      urgente:
        queryDto.urgente === undefined ? null : Boolean(queryDto.urgente),
      instituto: queryDto.instituto?.trim() || "",
      requerente: queryDto.requerente?.trim().toLowerCase() || "",
    };

    return [
      "nugecid:list",
      scope,
      `v:${version}`,
      `p:${page}`,
      `l:${limit}`,
      `s:${sortField}`,
      `d:${sortDirection}`,
      `f:${JSON.stringify(normalizedFilters)}`,
    ].join("|");
  }

  private async getFromCache<T>(key: string): Promise<T | undefined> {
    if (!this.cacheManager) {
      return undefined;
    }

    const namespace = "nugecid";
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

    const namespace = "nugecid";
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

  /**
   * Cria notificação para coordenadores quando novo desarquivamento é criado
   */
  private async criarNotificacaoNovoDesarquivamento(
    desarquivamento: DesarquivamentoTypeOrmEntity,
    criador: User,
  ): Promise<void> {
    try {
      // Buscar usuários coordenadores e administradores
      const coordenadores = await this.userRepository.find({
        where: [{ role: { name: "coordenador" } }, { role: { name: "admin" } }],
        relations: ["role"],
      });
      const notifiedUserIds = new Set<number>();
      const notificacoes: CreateNotificacaoDto[] = [];
      const prioridade = desarquivamento.urgente
        ? PrioridadeNotificacao.ALTA
        : PrioridadeNotificacao.MEDIA;

      for (const coord of coordenadores) {
        if (notifiedUserIds.has(coord.id)) {
          continue;
        }
        notifiedUserIds.add(coord.id);
        notificacoes.push({
          usuarioId: coord.id,
          tipo: TipoNotificacao.NOVO_DESARQUIVAMENTO,
          prioridade,
          titulo: "📄 Novo Desarquivamento Criado",
          descricao: `${criador.nome} criou solicitação #${desarquivamento.numeroSolicitacao} - ${desarquivamento.nomeCompleto}`,
          link: `/desarquivamentos/${desarquivamento.id}`,
          detalhes: {
            desarquivamentoId: desarquivamento.id,
            numeroSolicitacao: desarquivamento.numeroSolicitacao,
            criadoPor: criador.nome,
          },
        });
      }

      if (!notifiedUserIds.has(criador.id)) {
        notificacoes.push({
          usuarioId: criador.id,
          tipo: TipoNotificacao.NOVO_DESARQUIVAMENTO,
          prioridade,
          titulo: "📄 Sua solicitação foi registrada",
          descricao: `A solicitação #${desarquivamento.numeroSolicitacao} foi criada e aguarda análise.`,
          link: `/desarquivamentos/${desarquivamento.id}`,
          detalhes: {
            desarquivamentoId: desarquivamento.id,
            numeroSolicitacao: desarquivamento.numeroSolicitacao,
            criadoPor: criador.nome,
          },
        });
      }

      const notificacoesServiceCompat = this
        .notificacoesService as NotificacoesService & {
        createMany?: (dtos: CreateNotificacaoDto[]) => Promise<unknown>;
      };

      if (typeof notificacoesServiceCompat.createMany === "function") {
        await notificacoesServiceCompat.createMany(notificacoes);
      } else {
        await Promise.all(
          notificacoes.map((notificacaoDto) =>
            this.notificacoesService.create(notificacaoDto),
          ),
        );
      }

      this.logger.log(
        `✅ Notificações criadas para ${coordenadores.length} coordenadores`,
      );
    } catch (error) {
      this.logger.error("Erro ao criar notificações:", error);
    }
  }

  /**
   * Busca histórico de ações de um desarquivamento
   */
  async getHistorico(desarquivamentoId: number) {
    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where: { id: desarquivamentoId },
    });

    if (!desarquivamento) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    // Busca auditorias em múltiplos aliases de entidade para manter compatibilidade
    const [auditoriasLegacy, auditoriasResource] = await Promise.all([
      this.nugecidAuditService.findByEntity("nugecid", desarquivamentoId),
      this.nugecidAuditService.findByEntity(
        "DESARQUIVAMENTO",
        desarquivamentoId,
      ),
    ]);

    const auditorias = [...auditoriasLegacy, ...auditoriasResource]
      .filter(
        (audit, index, list) =>
          list.findIndex((candidate) => candidate.id === audit.id) === index,
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    const auditoriasConsolidadas = this.consolidateViewEntries(auditorias);

    // Formata os dados para o frontend
    return {
      success: true,
      data: auditoriasConsolidadas.map((audit) => ({
        id: audit.id,
        action: audit.action,
        actionLabel: audit.getActionLabel(),
        details: audit.details,
        timestamp: audit.timestamp,
        user: audit.user
          ? {
              id: audit.user.id,
              nome: audit.user.nome,
              usuario: audit.user.usuario,
            }
          : null,
        ipAddress: audit.ipAddress,
        success: audit.success,
      })),
    };
  }

  private consolidateViewEntries<T extends { action: string; userId: number }>(
    auditorias: T[],
  ): T[] {
    const nonViewEntries: T[] = [];
    const latestViewByUser = new Map<number, T>();

    for (const audit of auditorias) {
      if (String(audit.action).toUpperCase() !== "VIEW") {
        nonViewEntries.push(audit);
        continue;
      }

      const current = latestViewByUser.get(audit.userId);
      if (!current) {
        latestViewByUser.set(audit.userId, audit);
      }
    }

    return [...nonViewEntries, ...latestViewByUser.values()].sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
