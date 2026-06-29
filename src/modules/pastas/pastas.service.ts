import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
  Inject,
  Optional,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs/promises";
import { Pasta } from "./entities/pasta.entity";
import {
  PastaArquivo,
  PastaArquivoTipo,
} from "./entities/pasta-arquivo.entity";
import { CreatePastaDto } from "./dto/create-pasta.dto";
import { UpdatePastaDto } from "./dto/update-pasta.dto";
import { NotificacoesService } from "../notificacoes/services";
import { FileValidator } from "../../common/utils/file-validator";
import { SyncAction, SyncRealtimeService } from "../sync/sync-realtime.service";
import {
  CACHE_VERSION_INITIAL,
  CACHE_VERSION_KEYS,
} from "../../common/constants/cache-version.constants";
import { RuntimeMetricsService } from "../observability/runtime-metrics.service";
import { AntivirusService } from "../security/antivirus.service";
import {
  inferContentTypeFromFilename,
  StorageService,
} from "../storage/storage.service";
import { SearchService } from "../search/search.service";
import { readSpreadsheetMatrix } from "../../common/utils/spreadsheet.util";
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../../common/utils/pagination.util";

interface PastaFilesPayload {
  imagens?: Express.Multer.File[];
  planilha?: Express.Multer.File[];
  planilhas?: Express.Multer.File[];
}

const LEGACY_UPLOAD_ROOT = path.join(process.cwd(), "uploads", "pastas");
const LEGACY_UPLOAD_ROOT_RESOLVED = path.resolve(LEGACY_UPLOAD_ROOT);
const STORAGE_PREFIX = "pastas";

const ALLOWED_SPREADSHEET_EXTENSIONS = new Set([".xlsx", ".csv"]);
const ALLOWED_SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
]);

export interface PastaItemRow {
  id: string;
  pastaId: string;
  pastaNome: string;
  planilhaId: string;
  planilhaNome: string;
  sheetName: string;
  linha: number;
  destaque: string;
  valores: Record<string, string>;
}

export interface ParsedPlanilha {
  planilhaId: string;
  planilhaNome: string;
  sheetName: string;
  colunas: string[];
  itens: PastaItemRow[];
}

interface ParsedPlanilhaCacheEntry {
  signature: string;
  expiresAt: number;
  parsed: ParsedPlanilha | null;
}

const PLANILHA_CACHE_TTL_MS = 5 * 60 * 1000;
const PLANILHA_CACHE_MAX_ITEMS = 200;

@Injectable()
export class PastasService {
  private readonly logger = new Logger(PastasService.name);
  private readonly planilhaCache = new Map<string, ParsedPlanilhaCacheEntry>();
  private static readonly LIST_CACHE_TTL_SECONDS = 20;

  constructor(
    @InjectRepository(Pasta)
    private pastasRepository: Repository<Pasta>,
    @InjectRepository(PastaArquivo)
    private pastaArquivoRepository: Repository<PastaArquivo>,
    private readonly dataSource: DataSource,
    private readonly notificacoesService: NotificacoesService,
    private readonly syncRealtimeService: SyncRealtimeService,
    private readonly antivirusService: AntivirusService,
    private readonly storageService: StorageService,
    @Optional() private readonly searchService?: SearchService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
    @Optional()
    private readonly runtimeMetricsService?: RuntimeMetricsService,
  ) {}

  private schemaReady: Promise<void> | null = null;

  private ensureOwnership(pasta: Pasta, userId?: number) {
    if (userId && pasta.criadoPorId && pasta.criadoPorId !== userId) {
      throw new ForbiddenException("Acesso negado a esta pasta");
    }
  }

  private async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchemaIfNeeded();
    }
    return this.schemaReady;
  }

  private async createSchemaIfNeeded(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const hasTable = await queryRunner.hasTable("pasta_arquivos");
      if (!hasTable) {
        await queryRunner.query(`
          CREATE TABLE "pasta_arquivos" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "pasta_id" uuid NOT NULL,
            "tipo" VARCHAR(20) NOT NULL,
            "nome_original" VARCHAR(255) NOT NULL,
            "caminho" VARCHAR(512) NOT NULL,
            "tamanho_bytes" BIGINT NOT NULL,
            "data_upload" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "FK_pasta_arquivos_pasta" FOREIGN KEY ("pasta_id") REFERENCES "pastas"("id") ON DELETE CASCADE
          );
        `);
        await queryRunner.query(
          `CREATE INDEX "IDX_pasta_arquivos_pasta" ON "pasta_arquivos" ("pasta_id");`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_pasta_arquivos_tipo" ON "pasta_arquivos" ("tipo");`,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  async create(
    createPastaDto: CreatePastaDto,
    files?: PastaFilesPayload,
    usuarioId?: number,
  ): Promise<any> {
    await this.ensureSchema();
    const tags = this.normalizeTags(createPastaDto.tags);

    // Executar criação dentro de transação
    const pasta = await this.dataSource.transaction(async (manager) => {
      const novaPasta = manager.create(Pasta, {
        ...createPastaDto,
        id: randomUUID(),
        tags,
        imagens: 0,
        planilhas: 0,
        criadoPorId: usuarioId || null,
      });

      const saved = await manager.save(novaPasta);

      // Persistir arquivos (operação de disco + banco)
      await this.persistArquivosWithManager(manager, saved, files);

      return saved;
    });

    const pastaCompleta = await this.findOne(pasta.id);

    // Notificação fora da transação (pode falhar sem comprometer os dados)
    try {
      await this.notificacoesService.notificarPastaCriada(
        usuarioId ?? null,
        pasta.id,
        pasta.nome,
      );
    } catch (error) {
      this.logger.warn("Falha ao enviar notificação de nova prateleira", {
        error,
      });
    }

    this.emitPastaRealtime("created", pasta.id, usuarioId, {
      includePlanilhas: this.hasPlanilhaInPayload(files),
      metadata: { nome: pasta.nome },
    });
    this.searchService?.requestSyncPasta(pasta.id);

    await this.bumpReadCachesVersion();

    return pastaCompleta;
  }

  async findAll(userId?: number): Promise<any[]>;
  async findAll(
    userId: number | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<any>>;
  async findAll(
    userId?: number,
    pagination?: PaginationParams,
  ): Promise<any[] | PaginatedResult<any>> {
    await this.ensureSchema();
    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.PASTAS_LIST,
    );
    const paginationKey = pagination
      ? `:p:${pagination.page}:${pagination.limit}`
      : ":all";
    const cacheKey = `pastas:list:v${cacheVersion}:u:${userId ?? "all"}${paginationKey}`;
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Consulta leve: não carregar arquivos, apenas contar por tipo
    let queryBuilder = this.pastasRepository
      .createQueryBuilder("pasta")
      .orderBy("pasta.dataCriacao", "DESC")
      .loadRelationCountAndMap(
        "pasta.imagens",
        "pasta.arquivos",
        "arquivosImagem",
        (qb) =>
          qb.where("arquivosImagem.tipo = :img", {
            img: PastaArquivoTipo.IMAGEM,
          }),
      )
      .loadRelationCountAndMap(
        "pasta.planilhas",
        "pasta.arquivos",
        "arquivosPlanilha",
        (qb) =>
          qb.where("arquivosPlanilha.tipo = :planilha", {
            planilha: PastaArquivoTipo.PLANILHA,
          }),
      );

    // Filtrar por usuário se não for admin/coordenador
    if (userId) {
      queryBuilder = queryBuilder.andWhere("pasta.criadoPorId = :userId", {
        userId,
      });
    }

    if (pagination) {
      queryBuilder = queryBuilder
        .skip((pagination.page - 1) * pagination.limit)
        .take(pagination.limit);
      const [items, total] = await queryBuilder.getManyAndCount();
      const result = buildPaginatedResult<any>(items, total, pagination);
      await this.setInCache(
        cacheKey,
        result,
        PastasService.LIST_CACHE_TTL_SECONDS,
      );
      return result;
    }

    const pastas = await queryBuilder.take(100).getMany();
    await this.setInCache(
      cacheKey,
      pastas,
      PastasService.LIST_CACHE_TTL_SECONDS,
    );
    // Não precisamos mapear arquivos aqui; apenas retornamos contagens e metadados básicos
    return pastas;
  }

  async findOne(id: string, userId?: number): Promise<any> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    this.ensureOwnership(pasta, userId);
    return this.mapToResponse(pasta);
  }

  async update(
    id: string,
    updatePastaDto: UpdatePastaDto,
    userId?: number,
  ): Promise<any> {
    await this.ensureSchema();
    await this.findOne(id, userId); // valida acesso
    const payload: Partial<Pasta> = { ...updatePastaDto };
    if (updatePastaDto.tags !== undefined) {
      payload.tags = this.normalizeTags(updatePastaDto.tags);
    }
    await this.pastasRepository.update(id, payload);
    const pastaAtualizada = await this.findOne(id, userId);

    this.emitPastaRealtime("updated", id, userId, {
      metadata: { nome: pastaAtualizada?.nome },
    });
    this.searchService?.requestSyncPasta(id);

    await this.bumpReadCachesVersion();

    return pastaAtualizada;
  }

  async remove(id: string, userId?: number): Promise<void> {
    await this.ensureSchema();
    await this.findOne(id, userId); // valida acesso
    const arquivos = await this.pastaArquivoRepository.find({
      where: { pastaId: id },
    });

    for (const arquivo of arquivos) {
      if (arquivo.tipo === PastaArquivoTipo.PLANILHA) {
        this.invalidateCachedParsedPlanilha(arquivo.id);
      }
    }

    await Promise.all(
      arquivos.map((arquivo) => this.deleteStoredObject(arquivo.caminho)),
    );

    await this.pastaArquivoRepository.delete({ pastaId: id });
    await this.pastasRepository.delete(id);

    this.emitPastaRealtime("deleted", id, userId, {
      includePlanilhas: arquivos.some(
        (arquivo) => arquivo.tipo === PastaArquivoTipo.PLANILHA,
      ),
    });
    this.searchService?.requestRemovePasta(id);

    await this.bumpReadCachesVersion();
  }

  async adicionarArquivos(
    id: string,
    files?: PastaFilesPayload,
    userId?: number,
  ): Promise<any> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    this.ensureOwnership(pasta, userId);

    await this.persistArquivos(pasta, files);
    this.emitPastaRealtime("updated", id, userId, {
      includePlanilhas: this.hasPlanilhaInPayload(files),
    });
    this.searchService?.requestSyncPasta(id);
    await this.bumpReadCachesVersion();
    return this.findOne(id, userId);
  }

  async listarArquivos(pastaId: string, userId?: number): Promise<any[]> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id: pastaId },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    this.ensureOwnership(pasta, userId);
    return (
      pasta.arquivos?.map((arquivo) =>
        this.mapArquivoResponse(pasta, arquivo),
      ) ?? []
    );
  }

  async listarItens(
    pastaId: string,
    userId?: number,
  ): Promise<{
    pasta: any;
    totalItens: number;
    planilhas: ParsedPlanilha[];
  }> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id: pastaId },
      relations: ["arquivos"],
    });

    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    this.ensureOwnership(pasta, userId);

    const planilhas = await this.carregarPlanilhas(pasta);
    const totalItens = planilhas.reduce(
      (acc, planilha) => acc + planilha.itens.length,
      0,
    );

    return {
      pasta: this.mapToResponse(pasta),
      totalItens,
      planilhas,
    };
  }

  async buscarItens(
    query?: string,
    limit = 50,
    userId?: number,
  ): Promise<{
    query: string;
    total: number;
    itens: PastaItemRow[];
  }> {
    await this.ensureSchema();
    const trimmedQuery = query?.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      return {
        query: trimmedQuery ?? "",
        total: 0,
        itens: [],
      };
    }

    let queryBuilder = this.pastasRepository
      .createQueryBuilder("pasta")
      .leftJoinAndSelect("pasta.arquivos", "arquivos");

    // Filtrar por usuário se não for admin/coordenador
    if (userId) {
      queryBuilder = queryBuilder.andWhere("pasta.criadoPorId = :userId", {
        userId,
      });
    }

    const pastas = await queryBuilder.getMany();

    const itens: PastaItemRow[] = [];

    for (const pasta of pastas) {
      const planilhas = await this.carregarPlanilhas(pasta);
      for (const planilha of planilhas) {
        for (const item of planilha.itens) {
          if (this.matchesQuery(item, trimmedQuery)) {
            itens.push(item);
          }
        }
      }
    }

    itens.sort((a, b) =>
      (a.destaque || "").localeCompare(b.destaque || "", "pt-BR", {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const normalizedLimit = Math.floor(limit);
    const limited =
      Number.isFinite(normalizedLimit) && normalizedLimit > 0
        ? itens.slice(0, normalizedLimit)
        : itens;

    return {
      query: trimmedQuery,
      total: itens.length,
      itens: limited,
    };
  }

  async obterArquivo(
    pastaId: string,
    arquivoId: string,
    userId?: number,
  ): Promise<{
    buffer: Buffer;
    size: number;
    contentType?: string;
    nome: string;
    tipo: PastaArquivoTipo;
  }> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id: pastaId },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    this.ensureOwnership(pasta, userId);

    const arquivo = pasta.arquivos?.find((a) => a.id === arquivoId);
    if (!arquivo) {
      throw new NotFoundException("Arquivo nao encontrado");
    }

    const stored = await this.storageService.getObject(
      this.normalizeStoredPath(arquivo.caminho),
      {
        legacyAbsolutePath: this.resolveLegacyStoragePath(arquivo.caminho),
        contentType: inferContentTypeFromFilename(arquivo.nomeOriginal),
      },
    );

    return {
      buffer: stored.buffer,
      size: stored.size,
      contentType: stored.contentType,
      nome: arquivo.nomeOriginal,
      tipo: arquivo.tipo,
    };
  }

  async removerArquivo(
    pastaId: string,
    arquivoId: string,
    userId?: number,
  ): Promise<any> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id: pastaId },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    this.ensureOwnership(pasta, userId);

    const arquivo = pasta.arquivos?.find((a) => a.id === arquivoId);
    if (!arquivo) {
      throw new NotFoundException("Arquivo nao encontrado");
    }

    if (arquivo.tipo === PastaArquivoTipo.PLANILHA) {
      this.invalidateCachedParsedPlanilha(arquivo.id);
    }

    await this.deleteStoredObject(arquivo.caminho);
    await this.pastaArquivoRepository.delete({ id: arquivoId });

    await this.recalcularContagensArquivos(pastaId);

    this.emitPastaRealtime("updated", pastaId, userId, {
      includePlanilhas: arquivo.tipo === PastaArquivoTipo.PLANILHA,
      metadata: { removedFileId: arquivoId },
    });
    this.searchService?.requestSyncPasta(pastaId);

    await this.bumpReadCachesVersion();

    return this.findOne(pastaId, userId);
  }

  private async carregarPlanilhas(pasta: Pasta): Promise<ParsedPlanilha[]> {
    const arquivosPlanilha =
      pasta.arquivos?.filter(
        (arquivo) => arquivo.tipo === PastaArquivoTipo.PLANILHA,
      ) ?? [];

    const ordenados = [...arquivosPlanilha].sort((a, b) => {
      const dataA = a.dataUpload ? new Date(a.dataUpload).getTime() : 0;
      const dataB = b.dataUpload ? new Date(b.dataUpload).getTime() : 0;
      return dataB - dataA;
    });

    const resultados: ParsedPlanilha[] = [];

    for (const arquivo of ordenados) {
      const parsed = await this.parsePlanilhaArquivo(pasta, arquivo);
      if (parsed) {
        resultados.push(parsed);
      }
    }

    return resultados;
  }

  private async parsePlanilhaArquivo(
    pasta: Pasta,
    arquivo: PastaArquivo,
  ): Promise<ParsedPlanilha | null> {
    let signature: string | null = null;
    const cacheAndReturn = (parsed: ParsedPlanilha | null) => {
      if (signature) {
        this.setCachedParsedPlanilha(arquivo.id, signature, parsed);
      }
      return parsed;
    };

    try {
      const stat = await this.storageService
        .statObject(this.normalizeStoredPath(arquivo.caminho), {
          legacyAbsolutePath: this.resolveLegacyStoragePath(arquivo.caminho),
        })
        .catch(() => null);

      if (!stat) {
        this.invalidateCachedParsedPlanilha(arquivo.id);
        this.logger.warn(
          `Arquivo de planilha nao encontrado no storage: ${arquivo.caminho}`,
        );
        return null;
      }

      signature = `${stat.size}:${stat.lastModified?.getTime() ?? 0}`;
      const cached = this.getCachedParsedPlanilha(arquivo.id, signature);
      if (cached !== undefined) {
        return cached;
      }

      const buffer = await this.storageService
        .getObject(this.normalizeStoredPath(arquivo.caminho), {
          legacyAbsolutePath: this.resolveLegacyStoragePath(arquivo.caminho),
        })
        .then((stored) => stored.buffer);
      const { sheetName, rows: rawRows } = await readSpreadsheetMatrix(
        buffer,
        arquivo.nomeOriginal,
      );
      if (!sheetName) {
        return cacheAndReturn(null);
      }

      if (!rawRows.length) {
        return cacheAndReturn({
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          colunas: [],
          itens: [],
        });
      }

      const headerIndex = rawRows.findIndex(
        (row) =>
          Array.isArray(row) &&
          row.some(
            (valor) => valor !== undefined && String(valor ?? "").trim().length,
          ),
      );

      if (headerIndex === -1) {
        return cacheAndReturn({
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          colunas: [],
          itens: [],
        });
      }

      const headerRow = Array.isArray(rawRows[headerIndex])
        ? rawRows[headerIndex]
        : [];
      const dataRows = rawRows.slice(headerIndex + 1);
      const totalColumns = Math.max(
        headerRow.length,
        ...dataRows.map((row) => (Array.isArray(row) ? row.length : 0)),
        0,
      );

      if (totalColumns === 0) {
        return cacheAndReturn({
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          colunas: [],
          itens: [],
        });
      }

      const colunas = this.normalizeHeaders(headerRow, totalColumns);
      const itens: PastaItemRow[] = [];

      dataRows.forEach((rawRow, rowIndex) => {
        const row = Array.isArray(rawRow) ? rawRow : [];
        const valores: Record<string, string> = {};
        let filled = 0;

        for (let colIndex = 0; colIndex < totalColumns; colIndex += 1) {
          const header = colunas[colIndex];
          const cellValue = row[colIndex];
          const value =
            cellValue === undefined || cellValue === null
              ? ""
              : String(cellValue).trim();

          if (value) {
            filled += 1;
          }

          valores[header] = value;
        }

        if (filled === 0) {
          return;
        }

        const linha = headerIndex + 2 + rowIndex; // considerando linhas em branco antes do cabecalho

        itens.push({
          id: `${arquivo.id}:${linha}`,
          pastaId: pasta.id,
          pastaNome: pasta.nome,
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          linha,
          destaque: this.deriveDestaque(colunas, valores),
          valores,
        });
      });

      return cacheAndReturn({
        planilhaId: arquivo.id,
        planilhaNome: arquivo.nomeOriginal,
        sheetName,
        colunas,
        itens,
      });
    } catch (error) {
      if (signature) {
        this.setCachedParsedPlanilha(arquivo.id, signature, null);
      } else {
        this.invalidateCachedParsedPlanilha(arquivo.id);
      }
      this.logger.warn(
        `Falha ao processar planilha "${arquivo.nomeOriginal}" da pasta "${pasta.nome}": ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    }
  }

  private getCachedParsedPlanilha(
    planilhaId: string,
    signature: string,
  ): ParsedPlanilha | null | undefined {
    const entry = this.planilhaCache.get(planilhaId);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now() || entry.signature !== signature) {
      this.planilhaCache.delete(planilhaId);
      return undefined;
    }

    return entry.parsed;
  }

  private setCachedParsedPlanilha(
    planilhaId: string,
    signature: string,
    parsed: ParsedPlanilha | null,
  ): void {
    if (this.planilhaCache.has(planilhaId)) {
      this.planilhaCache.delete(planilhaId);
    }

    if (this.planilhaCache.size >= PLANILHA_CACHE_MAX_ITEMS) {
      const oldestKey = this.planilhaCache.keys().next().value;
      if (oldestKey) {
        this.planilhaCache.delete(oldestKey);
      }
    }

    this.planilhaCache.set(planilhaId, {
      signature,
      expiresAt: Date.now() + PLANILHA_CACHE_TTL_MS,
      parsed,
    });
  }

  private invalidateCachedParsedPlanilha(planilhaId: string): void {
    this.planilhaCache.delete(planilhaId);
  }

  private normalizeHeaders(headerRow: any[], totalColumns: number): string[] {
    const headers: string[] = [];
    const occurrences = new Map<string, number>();

    for (let index = 0; index < totalColumns; index += 1) {
      const rawValue = Array.isArray(headerRow) ? headerRow[index] : undefined;
      let baseName =
        rawValue === undefined || rawValue === null
          ? ""
          : String(rawValue).trim();

      if (!baseName) {
        baseName = `Coluna ${index + 1}`;
      }

      let candidate = baseName;
      let suffix = 1;

      while (occurrences.has(candidate.toLowerCase())) {
        suffix += 1;
        candidate = `${baseName} (${suffix})`;
      }

      occurrences.set(candidate.toLowerCase(), 1);
      headers.push(candidate);
    }

    return headers;
  }

  private deriveDestaque(
    headers: string[],
    valores: Record<string, string>,
  ): string {
    const prioridade = [
      "item",
      "itens",
      "descricao",
      "documento",
      "documentos",
      "numero",
      "processo",
      "codigo",
      "registro",
      "nome",
      "referencia",
    ];

    for (const fragmento of prioridade) {
      const header = headers.find((coluna) =>
        this.normalizeString(coluna).includes(fragmento),
      );

      if (header) {
        const valor = valores[header];
        if (this.hasValue(valor)) {
          return valor.trim();
        }
      }
    }

    const fallback = headers.find((header) => this.hasValue(valores[header]));
    if (fallback) {
      return valores[fallback].trim();
    }

    return "";
  }

  private matchesQuery(item: PastaItemRow, query: string): boolean {
    const normalizedQuery = this.normalizeString(query);
    if (!normalizedQuery) {
      return true;
    }

    if (this.normalizeString(item.destaque).includes(normalizedQuery)) {
      return true;
    }

    return Object.values(item.valores).some((valor) =>
      this.normalizeString(valor).includes(normalizedQuery),
    );
  }

  private normalizeString(value?: string): string {
    if (!value) {
      return "";
    }

    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  private hasValue(value?: string): value is string {
    return !!value && value.trim().length > 0;
  }

  private hasPlanilhaInPayload(files?: PastaFilesPayload): boolean {
    if (!files) {
      return false;
    }
    return Boolean(files.planilha?.length || files.planilhas?.length);
  }

  private emitPastaRealtime(
    action: SyncAction,
    pastaId: string,
    actorId?: number,
    options?: {
      includePlanilhas?: boolean;
      metadata?: Record<string, unknown>;
    },
  ): void {
    this.syncRealtimeService.emitDomainChange({
      scope: "pastas",
      action,
      entityId: pastaId,
      entityType: "pasta",
      actorId: actorId ?? null,
      metadata: options?.metadata,
    });

    if (options?.includePlanilhas) {
      this.syncRealtimeService.emitDomainChange({
        scope: "planilhas",
        action: "updated",
        entityType: "planilha",
        actorId: actorId ?? null,
        metadata: {
          pastaId,
        },
      });
    }

    this.syncRealtimeService.emitDomainChange({
      scope: "dashboard",
      action: "updated",
      entityType: "dashboard",
      actorId: actorId ?? null,
      metadata: {
        section: "pastas",
      },
    });
  }

  private normalizeTags(tags?: string[] | string): string[] {
    if (!tags) {
      return [];
    }

    if (Array.isArray(tags)) {
      return tags;
    }

    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }

    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private async persistArquivos(
    pasta: Pasta,
    files?: PastaFilesPayload,
  ): Promise<void> {
    if (
      !files ||
      (!files.imagens?.length &&
        !files.planilha?.length &&
        !files.planilhas?.length)
    ) {
      return;
    }

    const arquivosParaSalvar: PastaArquivo[] = [];

    const salvarArquivo = async (
      file: Express.Multer.File,
      tipo: PastaArquivoTipo,
    ) => {
      try {
        const buffer = await this.readUploadedFileBuffer(file);
        await this.validateIncomingFile(file, tipo, buffer);
        const safeOriginalName = this.sanitizeOriginalFilename(
          file.originalname,
        );
        const filename = this.buildStoredFilename(safeOriginalName);
        const storageKey = this.buildStorageKey(pasta.id, filename);

        await this.storageService.putObject(storageKey, buffer, {
          contentType: inferContentTypeFromFilename(safeOriginalName),
        });

        arquivosParaSalvar.push(
          this.pastaArquivoRepository.create({
            pastaId: pasta.id,
            tipo,
            nomeOriginal: safeOriginalName,
            caminho: storageKey,
            tamanhoBytes: file.size.toString(),
          }),
        );
      } finally {
        await this.cleanupTempUpload(file);
      }
    };

    for (const imagem of files.imagens ?? []) {
      await salvarArquivo(imagem, PastaArquivoTipo.IMAGEM);
    }

    const planilhaFiles = files.planilha ?? files.planilhas ?? [];
    for (const planilha of planilhaFiles) {
      await salvarArquivo(planilha, PastaArquivoTipo.PLANILHA);
    }

    if (arquivosParaSalvar.length) {
      await this.pastaArquivoRepository.save(arquivosParaSalvar);
      await this.recalcularContagensArquivos(pasta.id);
    }
  }

  // Versão com EntityManager para uso em transações
  private async persistArquivosWithManager(
    manager: any,
    pasta: Pasta,
    files?: PastaFilesPayload,
  ): Promise<void> {
    if (
      !files ||
      (!files.imagens?.length &&
        !files.planilha?.length &&
        !files.planilhas?.length)
    ) {
      return;
    }

    const arquivosParaSalvar: PastaArquivo[] = [];

    const salvarArquivo = async (
      file: Express.Multer.File,
      tipo: PastaArquivoTipo,
    ) => {
      try {
        const buffer = await this.readUploadedFileBuffer(file);
        await this.validateIncomingFile(file, tipo, buffer);
        const safeOriginalName = this.sanitizeOriginalFilename(
          file.originalname,
        );
        const filename = this.buildStoredFilename(safeOriginalName);
        const storageKey = this.buildStorageKey(pasta.id, filename);

        await this.storageService.putObject(storageKey, buffer, {
          contentType: inferContentTypeFromFilename(safeOriginalName),
        });

        arquivosParaSalvar.push(
          manager.create(PastaArquivo, {
            pastaId: pasta.id,
            tipo,
            nomeOriginal: safeOriginalName,
            caminho: storageKey,
            tamanhoBytes: file.size.toString(),
          }),
        );
      } finally {
        await this.cleanupTempUpload(file);
      }
    };

    for (const imagem of files.imagens ?? []) {
      await salvarArquivo(imagem, PastaArquivoTipo.IMAGEM);
    }

    const planilhaFiles = files.planilha ?? files.planilhas ?? [];
    for (const planilha of planilhaFiles) {
      await salvarArquivo(planilha, PastaArquivoTipo.PLANILHA);
    }

    if (arquivosParaSalvar.length) {
      await manager.save(arquivosParaSalvar);
      await this.recalcularContagensArquivosWithManager(manager, pasta.id);
    }
  }

  private async recalcularContagensArquivos(_pastaId: string): Promise<void> {
    // Não é mais necessário atualizar os campos imagens/planilhas no banco
    // pois as contagens são calculadas dinamicamente em mapToResponse()
    // Mantido como método vazio para compatibilidade com código existente
  }

  // Versão com EntityManager para uso em transações
  private async recalcularContagensArquivosWithManager(
    _manager: any,
    _pastaId: string,
  ): Promise<void> {
    // Não é mais necessário atualizar os campos imagens/planilhas no banco
    // pois as contagens são calculadas dinamicamente em mapToResponse()
    // Mantido como método vazio para compatibilidade com código existente
  }

  private async deleteStoredObject(caminhoRelativo: string): Promise<void> {
    await this.storageService.deleteObject(
      this.normalizeStoredPath(caminhoRelativo),
      {
        legacyAbsolutePath: this.resolveLegacyStoragePath(caminhoRelativo),
      },
    );
  }

  private async validateIncomingFile(
    file: Express.Multer.File,
    tipo: PastaArquivoTipo,
    fileBuffer?: Buffer,
  ): Promise<void> {
    const buffer = fileBuffer ?? (await this.readUploadedFileBuffer(file));
    if (!buffer.length) {
      throw new BadRequestException("Arquivo inválido ou vazio");
    }

    if (tipo === PastaArquivoTipo.IMAGEM) {
      await FileValidator.validateImage(buffer);
    } else {
      await this.validateSpreadsheetFile(file, buffer);
    }

    if (this.antivirusService) {
      await this.antivirusService.scanBuffer(buffer, {
        fileName: file.originalname,
        source: `pastas.${tipo}`,
      });
    }
  }

  private async validateSpreadsheetFile(
    file: Express.Multer.File,
    buffer: Buffer,
  ): Promise<void> {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_SPREADSHEET_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        "Formato de planilha inválido. Use .xlsx ou .csv.",
      );
    }

    const detectedMime = await FileValidator.detectFileType(buffer);
    if (detectedMime) {
      if (!ALLOWED_SPREADSHEET_MIME_TYPES.has(detectedMime)) {
        throw new BadRequestException(
          `Tipo de planilha inválido (${detectedMime}).`,
        );
      }
      return;
    }

    if (extension !== ".csv" || !this.looksLikeCsv(buffer)) {
      throw new BadRequestException(
        "Não foi possível validar a planilha enviada com segurança.",
      );
    }
  }

  private async readUploadedFileBuffer(
    file: Express.Multer.File,
  ): Promise<Buffer> {
    if (file?.buffer?.length) {
      return file.buffer;
    }

    if (file?.path) {
      try {
        return await fs.readFile(file.path);
      } catch {
        throw new BadRequestException(
          "Arquivo temporário não encontrado para processamento.",
        );
      }
    }

    throw new BadRequestException("Arquivo inválido ou vazio");
  }

  private async cleanupTempUpload(file: Express.Multer.File): Promise<void> {
    if (!file?.path) {
      return;
    }
    await fs.unlink(file.path).catch(() => undefined);
  }

  private looksLikeCsv(buffer: Buffer): boolean {
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    for (const byte of sample) {
      if (byte === 0) {
        return false;
      }
    }

    const text = sample.toString("utf8");
    if (!text.trim()) {
      return false;
    }

    return /[,;\t]/.test(text) && /\r?\n/.test(text);
  }

  private sanitizeOriginalFilename(originalName: string): string {
    const baseName = path.basename(originalName || "arquivo");
    const sanitized = baseName
      .normalize("NFKC")
      .replace(/[^\w.\-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 128);

    return sanitized || "arquivo";
  }

  private buildStoredFilename(safeOriginalName: string): string {
    const extension = path.extname(safeOriginalName).toLowerCase().slice(0, 10);
    return `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  }

  private buildStorageKey(pastaId: string, fileName: string): string {
    return `${STORAGE_PREFIX}/${pastaId}/${fileName}`;
  }

  private normalizeStoredPath(storedPath: string): string {
    const normalizedRelativePath = storedPath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    if (!normalizedRelativePath) {
      throw new BadRequestException("Caminho de arquivo inválido");
    }
    return normalizedRelativePath.startsWith(`${STORAGE_PREFIX}/`)
      ? normalizedRelativePath
      : `${STORAGE_PREFIX}/${normalizedRelativePath}`;
  }

  private resolveLegacyStoragePath(storedPath: string): string {
    const normalizedRelativePath = storedPath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    const legacyRelativePath = normalizedRelativePath.startsWith(
      `${STORAGE_PREFIX}/`,
    )
      ? normalizedRelativePath.slice(`${STORAGE_PREFIX}/`.length)
      : normalizedRelativePath;
    const absolutePath = path.resolve(
      LEGACY_UPLOAD_ROOT_RESOLVED,
      legacyRelativePath,
    );

    if (
      absolutePath !== LEGACY_UPLOAD_ROOT_RESOLVED &&
      !absolutePath.startsWith(`${LEGACY_UPLOAD_ROOT_RESOLVED}${path.sep}`)
    ) {
      throw new BadRequestException("Caminho de arquivo inválido");
    }

    return absolutePath;
  }

  private async bumpReadCachesVersion(): Promise<void> {
    await Promise.allSettled([
      this.bumpCacheVersion(CACHE_VERSION_KEYS.PASTAS_LIST),
      this.bumpCacheVersion(CACHE_VERSION_KEYS.APP_GLOBAL_SEARCH),
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

    const namespace = "pastas";
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

    const namespace = "pastas";
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

  private mapToResponse(pasta: Pasta): any {
    // Calcular contagens reais dos arquivos ao invés de confiar nos campos
    const arquivos = pasta.arquivos ?? [];
    const imagens = arquivos.filter(
      (a) => a.tipo === PastaArquivoTipo.IMAGEM,
    ).length;
    const planilhas = arquivos.filter(
      (a) => a.tipo === PastaArquivoTipo.PLANILHA,
    ).length;

    return {
      ...pasta,
      imagens, // Sobrescrever com contagem real
      planilhas, // Sobrescrever com contagem real
      arquivos: arquivos.map((arquivo) =>
        this.mapArquivoResponse(pasta, arquivo),
      ),
    };
  }

  private mapArquivoResponse(pasta: Pasta, arquivo: PastaArquivo) {
    return {
      id: arquivo.id,
      tipo: arquivo.tipo,
      nomeOriginal: arquivo.nomeOriginal,
      tamanhoBytes: Number(arquivo.tamanhoBytes),
      dataUpload: arquivo.dataUpload,
      url: `/api/pastas/${pasta.id}/arquivos/${arquivo.id}/download`,
      previewUrl:
        arquivo.tipo === PastaArquivoTipo.IMAGEM
          ? `/api/pastas/${pasta.id}/arquivos/${arquivo.id}/view`
          : undefined,
    };
  }
}
