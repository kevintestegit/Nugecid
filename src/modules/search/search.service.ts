import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, IsNull, Repository } from "typeorm";
import { MeiliSearch } from "meilisearch";
import * as path from "path";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { DesarquivamentoAnexoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento-anexo.typeorm-entity";
import { Pasta } from "../pastas/entities/pasta.entity";
import { PlanilhaControle } from "../planilhas/entities/planilha-controle.entity";
import { StorageService } from "../storage/storage.service";
import {
  expandRolesForTransition,
  TRANSITION_NUGECID_FULL_ACCESS_ROLES,
} from "../users/enums/role.utils";
import {
  DOCUMENT_SEARCH_TYPES,
  DocumentSearchType,
  SearchDocument,
  SearchHealthStatus,
  SearchResultItem,
} from "./search.types";
import { readSpreadsheetMatrix } from "../../common/utils/spreadsheet.util";

const DESARQUIVAMENTO_FULL_ACCESS_ROLES = Array.from(
  TRANSITION_NUGECID_FULL_ACCESS_ROLES,
) as readonly string[];
const PASTA_FULL_ACCESS_ROLES = ["admin", "coordenador"] as const;
const SEARCHABLE_ATTRIBUTES = [
  "title",
  "subtitle",
  "description",
  "searchText",
];
const FILTERABLE_ATTRIBUTES = [
  "type",
  "visibilityScope",
  "allowedUserIds",
  "fullAccessRoles",
];
const SORTABLE_ATTRIBUTES = ["sortTimestamp"];
const MAX_PLANILHA_TEXT_LENGTH = 150_000;
const MAX_ATTACHMENT_TEXT_LENGTH = 250_000;
const REINDEX_BATCH_SIZE = 100;
const LEGACY_PLANILHA_ROOT = path.resolve(
  process.cwd(),
  "uploads",
  "planilhas",
);

export function isDocumentSearchType(
  value: string,
): value is DocumentSearchType {
  return (DOCUMENT_SEARCH_TYPES as readonly string[]).includes(value);
}

export function buildSearchDocumentId(
  type: DocumentSearchType,
  entityId: number | string,
): string {
  return `${type}_${entityId}`;
}

export function buildMeiliVisibilityFilter(params: {
  currentUserId: number;
  currentUserRoles: string[];
  requestedTypes?: string[];
}): string {
  const requestedTypes = (params.requestedTypes ?? []).filter(
    isDocumentSearchType,
  );

  const filters: string[] = [];

  if (requestedTypes.length > 0) {
    filters.push(
      `(${requestedTypes.map((type) => `type = ${quoteString(type)}`).join(" OR ")})`,
    );
  }

  const visibilityClauses = [
    `visibilityScope = ${quoteString("authenticated")}`,
    `allowedUserIds = ${params.currentUserId}`,
    ...expandRolesForTransition(params.currentUserRoles).map(
      (role) => `fullAccessRoles = ${quoteString(role)}`,
    ),
  ];

  filters.push(`(${visibilityClauses.join(" OR ")})`);

  return filters.join(" AND ");
}

function quoteString(value: string): string {
  return JSON.stringify(value);
}

function truncateText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly client?: MeiliSearch;
  private readonly indexUid: string;
  private setupPromise: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    @InjectRepository(DesarquivamentoAnexoTypeOrmEntity)
    private readonly anexoRepository: Repository<DesarquivamentoAnexoTypeOrmEntity>,
    @InjectRepository(Pasta)
    private readonly pastaRepository: Repository<Pasta>,
    @InjectRepository(PlanilhaControle)
    private readonly planilhaRepository: Repository<PlanilhaControle>,
  ) {
    this.indexUid = this.configService.get<string>(
      "SEARCH_MEILI_INDEX",
      "global_documents",
    );

    if (this.isEnabled()) {
      this.client = new MeiliSearch({
        host: this.configService.get<string>(
          "SEARCH_MEILI_HOST",
          "http://127.0.0.1:7700",
        ),
        apiKey: this.configService.get<string>("SEARCH_MEILI_API_KEY"),
      });
    }
  }

  onModuleInit(): void {
    if (!this.isEnabled()) {
      return;
    }

    this.setupPromise = this.ensureIndexReady();

    if (this.shouldBootstrapOnStart()) {
      this.fireAndForget("bootstrap do índice de busca", async () => {
        await this.ensureIndexReady();
        await this.reindexAllDocuments();
      });
    }
  }

  isEnabled(): boolean {
    return this.configService.get<string>("SEARCH_ENABLED", "false") === "true";
  }

  async searchDocuments(params: {
    query: string;
    limit: number;
    requestedTypes?: string[];
    currentUserId: number;
    currentUserRoles: string[];
  }): Promise<SearchResultItem[]> {
    if (!this.isEnabled() || !this.client) {
      return [];
    }

    await this.ensureIndexReady();

    const index = this.client.index<SearchDocument>(this.indexUid);
    const filter = buildMeiliVisibilityFilter({
      currentUserId: params.currentUserId,
      currentUserRoles: params.currentUserRoles,
      requestedTypes: params.requestedTypes,
    });

    const response = await index.search(params.query, {
      filter,
      limit: params.limit,
    });

    return response.hits.map((hit) => ({
      id: hit.entityId,
      type: hit.type,
      title: hit.title,
      subtitle: hit.subtitle,
      description: hit.description,
      url: hit.url,
      metadata: hit.metadata,
    }));
  }

  requestFullReindex(): boolean {
    if (!this.isEnabled()) {
      return false;
    }

    this.fireAndForget("reindexação manual do índice", async () => {
      await this.ensureIndexReady();
      await this.reindexAllDocuments();
    });

    return true;
  }

  async getHealthStatus(): Promise<SearchHealthStatus> {
    const failOpen = this.shouldFailOpen();
    const bootstrapOnStart = this.shouldBootstrapOnStart();

    if (!this.isEnabled() || !this.client) {
      return {
        enabled: false,
        status: "disabled",
        indexUid: this.indexUid,
        failOpen,
        bootstrapOnStart,
      };
    }

    try {
      await this.ensureIndexReady();
      await this.client.health();

      return {
        enabled: true,
        status: "ready",
        indexUid: this.indexUid,
        failOpen,
        bootstrapOnStart,
      };
    } catch (error) {
      return {
        enabled: true,
        status: "degraded",
        indexUid: this.indexUid,
        failOpen,
        bootstrapOnStart,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  requestSyncDesarquivamento(desarquivamentoId: number): void {
    this.fireAndForget(
      `sincronização do desarquivamento ${desarquivamentoId}`,
      async () => {
        await this.upsertDocument(
          await this.buildDesarquivamentoDocument(desarquivamentoId),
        );
      },
    );
  }

  requestRemoveDesarquivamento(desarquivamentoId: number): void {
    this.fireAndForget(
      `remoção do desarquivamento ${desarquivamentoId} do índice`,
      async () => {
        await this.removeDocument("desarquivamento", desarquivamentoId);
      },
    );
  }

  requestSyncPasta(pastaId: string): void {
    this.fireAndForget(`sincronização da pasta ${pastaId}`, async () => {
      await this.upsertDocument(await this.buildPastaDocument(pastaId));
    });
  }

  requestRemovePasta(pastaId: string): void {
    this.fireAndForget(`remoção da pasta ${pastaId} do índice`, async () => {
      await this.removeDocument("pasta", pastaId);
    });
  }

  requestSyncPlanilha(planilhaId: string): void {
    this.fireAndForget(`sincronização da planilha ${planilhaId}`, async () => {
      await this.upsertDocument(await this.buildPlanilhaDocument(planilhaId));
    });
  }

  requestRemovePlanilha(planilhaId: string): void {
    this.fireAndForget(
      `remoção da planilha ${planilhaId} do índice`,
      async () => {
        await this.removeDocument("planilha", planilhaId);
      },
    );
  }

  requestSyncDesarquivamentoTargets(input: {
    desarquivamentoId?: number | null;
    numeroProcesso?: string | null;
  }): void {
    this.fireAndForget("sincronização de anexos OCR no índice", async () => {
      if (input.desarquivamentoId) {
        await this.upsertDocument(
          await this.buildDesarquivamentoDocument(input.desarquivamentoId),
        );
      }

      if (input.numeroProcesso) {
        const ids = await this.desarquivamentoRepository.find({
          select: { id: true },
          where: {
            numeroProcesso: input.numeroProcesso,
            deletedAt: IsNull(),
          },
        });

        for (const item of ids) {
          if (item.id !== input.desarquivamentoId) {
            await this.upsertDocument(
              await this.buildDesarquivamentoDocument(item.id),
            );
          }
        }
      }
    });
  }

  async reindexAllDocuments(): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    await this.ensureIndexReady();
    const index = this.client.index<SearchDocument>(this.indexUid);
    const summary = {
      indexed: 0,
      failedBatches: 0,
      failedDocuments: 0,
    };

    const processBatch = async (
      label: string,
      batchNumber: number,
      totalBatches: number,
      documents: Array<SearchDocument | null>,
      processedCount: number,
      totalCount: number,
    ): Promise<void> => {
      const payload = documents.filter(
        (document): document is SearchDocument => document !== null,
      );

      if (!payload.length) {
        this.logger.log(
          `Reindexação ${label}: lote ${batchNumber}/${totalBatches} sem documentos válidos (${processedCount}/${totalCount}).`,
        );
        return;
      }

      try {
        await index.addDocuments(payload, { primaryKey: "id" });
        summary.indexed += payload.length;
        this.logger.log(
          `Reindexação ${label}: lote ${batchNumber}/${totalBatches} enviado (${processedCount}/${totalCount}).`,
        );
      } catch (error) {
        summary.failedBatches += 1;
        this.logger.error(
          `Falha ao reindexar ${label} no lote ${batchNumber}/${totalBatches}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    };

    const processEntities = async <T extends { id: number | string }>(
      label: string,
      totalCount: number,
      fetchBatch: (offset: number, limit: number) => Promise<T[]>,
      buildDocument: (id: T["id"]) => Promise<SearchDocument | null>,
    ): Promise<void> => {
      if (!totalCount) {
        return;
      }

      const totalBatches = Math.ceil(totalCount / REINDEX_BATCH_SIZE);
      let processedCount = 0;

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
        let items: T[];
        try {
          items = await fetchBatch(
            batchIndex * REINDEX_BATCH_SIZE,
            REINDEX_BATCH_SIZE,
          );
        } catch (error) {
          summary.failedBatches += 1;
          this.logger.error(
            `Falha ao carregar lote ${batchIndex + 1}/${totalBatches} de ${label}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          continue;
        }

        if (!items.length) {
          break;
        }

        processedCount += items.length;
        const settledDocuments = await Promise.allSettled(
          items.map((item) => buildDocument(item.id)),
        );

        const documents = settledDocuments.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value;
          }

          summary.failedDocuments += 1;
          this.logger.warn(
            `Falha ao montar documento de ${label} para id ${String(
              items[index]?.id,
            )}: ${
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason)
            }`,
          );
          return null;
        });

        await processBatch(
          label,
          batchIndex + 1,
          totalBatches,
          documents,
          processedCount,
          totalCount,
        );
      }
    };

    let desarquivamentoTotal = 0;
    try {
      desarquivamentoTotal = await this.desarquivamentoRepository.count({
        where: { deletedAt: IsNull() },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao contar desarquivamentos para reindexação: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let pastaTotal = 0;
    try {
      pastaTotal = await this.pastaRepository.count();
    } catch (error) {
      this.logger.error(
        `Falha ao contar pastas para reindexação: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const planilhaTotal = await this.countPlanilhasForBootstrap();

    await processEntities(
      "desarquivamentos",
      desarquivamentoTotal,
      (offset, limit) =>
        this.desarquivamentoRepository.find({
          select: { id: true },
          where: { deletedAt: IsNull() },
          order: { id: "ASC" },
          skip: offset,
          take: limit,
        }),
      (id) => this.buildDesarquivamentoDocument(id),
    );

    await processEntities(
      "pastas",
      pastaTotal,
      (offset, limit) =>
        this.pastaRepository.find({
          select: { id: true },
          order: { id: "ASC" },
          skip: offset,
          take: limit,
        }),
      (id) => this.buildPastaDocument(id),
    );

    await processEntities(
      "planilhas",
      planilhaTotal,
      (offset, limit) => this.getPlanilhaIdsForBootstrap({ offset, limit }),
      (id) => this.buildPlanilhaDocument(id),
    );

    if (!summary.indexed) {
      this.logger.log(
        "Bootstrap do índice concluído sem documentos para indexar.",
      );
      return;
    }

    this.logger.log(
      `Bootstrap do índice concluído com ${summary.indexed} documentos documentais.`,
    );

    if (summary.failedBatches || summary.failedDocuments) {
      this.logger.warn(
        `Reindexação concluída com ${summary.failedBatches} lote(s) falho(s) e ${summary.failedDocuments} documento(s) ignorado(s).`,
      );
    }
  }

  private async ensureIndexReady(): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    if (!this.setupPromise) {
      this.setupPromise = this.configureIndex();
    }

    return this.setupPromise;
  }

  private async configureIndex(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client
        .createIndex(this.indexUid, { primaryKey: "id" })
        .catch(() => undefined);

      await this.client.index<SearchDocument>(this.indexUid).updateSettings({
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        filterableAttributes: FILTERABLE_ATTRIBUTES,
        sortableAttributes: SORTABLE_ATTRIBUTES,
      });
    } catch (error) {
      this.setupPromise = null;
      throw error;
    }
  }

  private async upsertDocument(document: SearchDocument | null): Promise<void> {
    if (!document || !this.client || !this.isEnabled()) {
      return;
    }

    await this.ensureIndexReady();
    await this.client
      .index<SearchDocument>(this.indexUid)
      .addDocuments([document], {
        primaryKey: "id",
      });
  }

  private async removeDocument(
    type: DocumentSearchType,
    entityId: number | string,
  ): Promise<void> {
    if (!this.client || !this.isEnabled()) {
      return;
    }

    await this.ensureIndexReady();
    await this.client
      .index<SearchDocument>(this.indexUid)
      .deleteDocument(buildSearchDocumentId(type, entityId));
  }

  private async buildDesarquivamentoDocument(
    desarquivamentoId: number,
  ): Promise<SearchDocument | null> {
    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where: {
        id: desarquivamentoId,
        deletedAt: IsNull(),
      },
    });

    if (!desarquivamento) {
      return null;
    }

    const attachmentText = await this.buildAttachmentSearchText({
      desarquivamentoId,
      numeroProcesso: desarquivamento.numeroProcesso,
    });

    const allowedUserIds = Array.from(
      new Set(
        [desarquivamento.criadoPorId, desarquivamento.responsavelId].filter(
          (value): value is number => typeof value === "number" && value > 0,
        ),
      ),
    );

    return {
      id: buildSearchDocumentId("desarquivamento", desarquivamento.id),
      entityId: desarquivamento.id,
      type: "desarquivamento",
      title: `Solicitação #${desarquivamento.numeroSolicitacao}`,
      subtitle: `${desarquivamento.tipoDesarquivamento} - ${desarquivamento.nomeCompleto}`,
      description: `NIC/Laudo/Auto: ${desarquivamento.numeroNicLaudoAuto || "—"} | Processo: ${desarquivamento.numeroProcesso || "—"}`,
      url: `/desarquivamentos/${desarquivamento.id}`,
      metadata: {
        status: desarquivamento.status,
        setor: desarquivamento.setorDemandante,
        dataSolicitacao: desarquivamento.dataSolicitacao,
        tipoDocumento: desarquivamento.tipoDocumento,
        numeroProcesso: desarquivamento.numeroProcesso,
        numeroNicLaudoAuto: desarquivamento.numeroNicLaudoAuto,
      },
      searchText: truncateText(
        [
          desarquivamento.nomeCompleto,
          desarquivamento.numeroNicLaudoAuto,
          desarquivamento.numeroProcesso,
          desarquivamento.setorDemandante,
          desarquivamento.servidorResponsavel,
          desarquivamento.tipoDocumento,
          desarquivamento.finalidadeDesarquivamento,
          desarquivamento.dadosAdicionais,
          attachmentText,
        ]
          .filter(Boolean)
          .join("\n"),
        MAX_ATTACHMENT_TEXT_LENGTH,
      ),
      visibilityScope: "restricted",
      allowedUserIds,
      fullAccessRoles: [...DESARQUIVAMENTO_FULL_ACCESS_ROLES],
      sortTimestamp: desarquivamento.createdAt?.getTime() ?? Date.now(),
    };
  }

  private async buildPastaDocument(
    pastaId: string,
  ): Promise<SearchDocument | null> {
    const pasta = await this.pastaRepository.findOne({
      where: { id: pastaId },
    });

    if (!pasta) {
      return null;
    }

    return {
      id: buildSearchDocumentId("pasta", pasta.id),
      entityId: pasta.id,
      type: "pasta",
      title: pasta.nome,
      subtitle: pasta.tags?.join(", ") || "",
      description: pasta.descricao || "",
      url: `/arquivo/${pasta.id}`,
      metadata: {
        imagens: pasta.imagens,
        planilhas: pasta.planilhas,
        dataCriacao: pasta.dataCriacao,
      },
      searchText: [pasta.nome, pasta.descricao, ...(pasta.tags || [])]
        .filter(Boolean)
        .join("\n"),
      visibilityScope: "restricted",
      allowedUserIds:
        typeof pasta.criadoPorId === "number" && pasta.criadoPorId > 0
          ? [pasta.criadoPorId]
          : [],
      fullAccessRoles: [...PASTA_FULL_ACCESS_ROLES],
      sortTimestamp: pasta.dataCriacao?.getTime() ?? Date.now(),
    };
  }

  private async buildPlanilhaDocument(
    planilhaId: string,
  ): Promise<SearchDocument | null> {
    const planilha = await this.planilhaRepository.findOne({
      where: { id: planilhaId },
    });

    if (!planilha) {
      return null;
    }

    const spreadsheetText = await this.extractPlanilhaText(planilha);

    return {
      id: buildSearchDocumentId("planilha", planilha.id),
      entityId: planilha.id,
      type: "planilha",
      title: planilha.nomeOriginal || "Planilha sem nome",
      subtitle: `Upload: ${planilha.dataUpload ? new Date(planilha.dataUpload).toISOString().slice(0, 10) : "Data desconhecida"}`,
      description: `Tamanho: ${planilha.tamanhoBytes || "0"} bytes`,
      url: `/arquivo?tab=planilhas&planilhaId=${planilha.id}`,
      metadata: {
        tamanhoBytes: planilha.tamanhoBytes,
        dataUpload: planilha.dataUpload,
      },
      searchText: truncateText(
        [planilha.nomeOriginal, spreadsheetText].filter(Boolean).join("\n"),
        MAX_PLANILHA_TEXT_LENGTH,
      ),
      visibilityScope: "restricted",
      allowedUserIds: [],
      fullAccessRoles: [...PASTA_FULL_ACCESS_ROLES],
      sortTimestamp: planilha.dataUpload?.getTime() ?? Date.now(),
    };
  }

  private async extractPlanilhaText(
    planilha: PlanilhaControle,
  ): Promise<string> {
    try {
      const storedPath = this.normalizePlanilhaStoredPath(planilha.caminho);
      const arquivo = await this.storageService.getObject(storedPath, {
        legacyAbsolutePath: this.resolveLegacyPlanilhaPath(planilha.caminho),
      });
      const { sheetName, rows } = await readSpreadsheetMatrix(
        arquivo.buffer,
        planilha.nomeOriginal,
      );
      const lines: string[] = [];

      lines.push(sheetName);
      for (const row of rows) {
        const rendered = row
          .map((cell) => String(cell ?? "").trim())
          .filter(Boolean)
          .join(" | ");

        if (rendered) {
          lines.push(rendered);
        }
      }

      return truncateText(lines.join("\n"), MAX_PLANILHA_TEXT_LENGTH);
    } catch (error) {
      this.logger.warn(
        `Falha ao extrair texto da planilha ${planilha.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return "";
    }
  }

  private normalizePlanilhaStoredPath(storedPath: string): string {
    const normalizedRelativePath = storedPath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    if (!normalizedRelativePath) {
      throw new Error("Caminho de planilha inválido.");
    }

    return normalizedRelativePath.includes("/")
      ? normalizedRelativePath
      : `planilhas/${normalizedRelativePath}`;
  }

  private resolveLegacyPlanilhaPath(storedPath: string): string {
    const normalizedRelativePath = storedPath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    const legacyRelativePath = normalizedRelativePath.startsWith("planilhas/")
      ? normalizedRelativePath.slice("planilhas/".length)
      : normalizedRelativePath;
    const absolutePath = path.resolve(LEGACY_PLANILHA_ROOT, legacyRelativePath);

    if (
      absolutePath !== LEGACY_PLANILHA_ROOT &&
      !absolutePath.startsWith(`${LEGACY_PLANILHA_ROOT}${path.sep}`)
    ) {
      throw new Error("Caminho legado de planilha inválido.");
    }

    return absolutePath;
  }

  private shouldBootstrapOnStart(): boolean {
    return (
      this.configService.get<string>("SEARCH_BOOTSTRAP_ON_START", "false") ===
      "true"
    );
  }

  private shouldFailOpen(): boolean {
    return (
      this.configService.get<string>("SEARCH_FAIL_OPEN", "true") === "true"
    );
  }

  private async getPlanilhaIdsForBootstrap(params?: {
    offset?: number;
    limit?: number;
  }): Promise<Array<Pick<PlanilhaControle, "id">>> {
    try {
      return await this.planilhaRepository.find({
        select: { id: true },
        skip: params?.offset,
        take: params?.limit,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar planilhas para bootstrap do índice: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  private async countPlanilhasForBootstrap(): Promise<number> {
    try {
      return await this.planilhaRepository.count();
    } catch (error) {
      this.logger.warn(
        `Falha ao contar planilhas para bootstrap do índice: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 0;
    }
  }

  private fireAndForget(
    description: string,
    handler: () => Promise<void>,
  ): void {
    if (!this.isEnabled()) {
      return;
    }

    void handler().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);

      if (this.shouldFailOpen()) {
        this.logger.warn(
          `Meilisearch indisponível; operação ignorada por fail-open (${description}): ${message}`,
        );
        return;
      }

      this.logger.error(
        `Falha na sincronização do índice (${description}): ${message}`,
      );
    });
  }

  private async buildAttachmentSearchText(input: {
    desarquivamentoId: number;
    numeroProcesso?: string | null;
  }): Promise<string> {
    try {
      const anexos = await this.anexoRepository
        .createQueryBuilder("anexo")
        .addSelect("anexo.ocrTexto")
        .where(
          new Brackets((qb) => {
            qb.where("anexo.desarquivamentoId = :desarquivamentoId", {
              desarquivamentoId: input.desarquivamentoId,
            });

            if (input.numeroProcesso) {
              qb.orWhere("anexo.numeroProcesso = :numeroProcesso", {
                numeroProcesso: input.numeroProcesso,
              });
            }
          }),
        )
        .andWhere("anexo.tipoMime = :mimeType", { mimeType: "application/pdf" })
        .andWhere("anexo.ocrStatus = :ocrStatus", { ocrStatus: "completed" })
        .orderBy("anexo.createdAt", "DESC")
        .getMany();

      return truncateText(
        anexos
          .map((anexo) =>
            [anexo.nomeOriginal, anexo.descricao, anexo.ocrTexto]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n"),
        MAX_ATTACHMENT_TEXT_LENGTH,
      );
    } catch (error) {
      this.logger.warn(
        `OCR legado indisponível para indexação do desarquivamento ${input.desarquivamentoId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return "";
    }
  }
}
