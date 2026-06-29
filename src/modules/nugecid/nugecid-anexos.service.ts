import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { randomUUID } from "crypto";
import * as path from "path";

import { DesarquivamentoAnexoTypeOrmEntity } from "./infrastructure/entities/desarquivamento-anexo.typeorm-entity";
import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import { User } from "../users/entities/user.entity";
import {
  DEFAULT_DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
  FileValidator,
} from "../../common/utils/file-validator";
import { AntivirusService } from "../security/antivirus.service";
import { StorageService } from "../storage/storage.service";
import type { StorageObjectStream } from "../storage/storage.service";
import { OcrService } from "../ocr/ocr.service";
import { OcrProcessResult } from "../ocr/ocr.types";
import { SearchService } from "../search/search.service";
import {
  analyzeOcrTextForSignatures,
  OcrDetectedSignature,
} from "./ocr-signature-analysis";

export interface AnexoOcrAnalysisResult {
  anexoId: number;
  nomeOriginal: string;
  tipoMime: string;
  ocrStatus: string | null;
  processedAt: Date | null;
  error: string | null;
  searchablePdfAvailable: boolean;
  textAvailable: boolean;
  rawText: string | null;
  possibleNames: string[];
  signatures: OcrDetectedSignature[];
}

type DesarquivamentoAccessRecord = Pick<
  DesarquivamentoTypeOrmEntity,
  "id" | "numeroProcesso" | "criadoPorId" | "responsavelId"
>;

@Injectable()
export class NugecidAnexosService {
  private readonly logger = new Logger(NugecidAnexosService.name);
  private readonly storagePrefix = "desarquivamentos";

  constructor(
    @InjectRepository(DesarquivamentoAnexoTypeOrmEntity)
    private readonly anexoRepository: Repository<DesarquivamentoAnexoTypeOrmEntity>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    private readonly antivirusService: AntivirusService,
    private readonly storageService: StorageService,
    private readonly ocrService: OcrService,
    @Optional() private readonly searchService?: SearchService,
  ) {}

  async uploadAnexo(
    desarquivamentoId: number,
    file: Express.Multer.File,
    user: User,
    descricao?: string,
    tipoAnexo: "desarquivamento" | "rearquivamento" = "desarquivamento",
    anexarAoProcesso: boolean = false,
  ): Promise<any> {
    const desarquivamento = await this.assertCanAccessDesarquivamento(
      desarquivamentoId,
      user,
    );

    // Validar tipo de arquivo (tamanho e MIME type básico)
    this.validateFile(file);

    // Validar conteúdo real do arquivo por magic bytes
    await FileValidator.validateImageOrDocument(file.buffer, file.mimetype);
    await this.antivirusService.scanBuffer(file.buffer, {
      fileName: file.originalname,
      source: "nugecid.anexos.upload",
    });

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    const storageKey = this.buildStorageKey(uniqueFileName);

    await this.storageService.putObject(storageKey, file.buffer, {
      contentType: file.mimetype,
    });

    let ocrResult: OcrProcessResult | null = null;

    try {
      ocrResult = await this.ocrService.processDocument({
        fileName: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
        storageKey,
        source: "nugecid.anexos.upload",
      });

      // Criar registro no banco
      const anexo = this.anexoRepository.create({
        desarquivamentoId: anexarAoProcesso ? null : desarquivamentoId,
        numeroProcesso: anexarAoProcesso
          ? desarquivamento.numeroProcesso
          : null,
        usuarioId: user.id,
        nomeOriginal: file.originalname,
        nomeArquivo: uniqueFileName,
        caminhoArquivo: storageKey,
        tipoMime: file.mimetype,
        tamanhoBytes: file.size,
        descricao: descricao || null,
        tipoAnexo,
        ocrStatus: ocrResult.status,
        ocrPdfPath: ocrResult.searchablePdfKey || null,
        ocrTextPath: ocrResult.textKey || null,
        ocrTexto: ocrResult.text || null,
        ocrProcessedAt: ocrResult.processedAt,
        ocrError: ocrResult.error || null,
      });

      const savedAnexo = await this.anexoRepository.save(anexo);

      const tipoVinculo = anexarAoProcesso ? "processo" : "solicitação";
      this.logger.log(
        `Anexo criado: ${savedAnexo.nomeOriginal} para ${tipoVinculo} ${anexarAoProcesso ? desarquivamento.numeroProcesso : desarquivamentoId} por ${user.usuario}`,
      );

      this.searchService?.requestSyncDesarquivamentoTargets({
        desarquivamentoId: savedAnexo.desarquivamentoId,
        numeroProcesso: savedAnexo.numeroProcesso,
      });

      return this.mapAnexoResponse(savedAnexo);
    } catch (error) {
      await this.cleanupStoredObjects(storageKey, ocrResult);
      throw error;
    }
  }

  private mapAnexoResponse(anexo: DesarquivamentoAnexoTypeOrmEntity) {
    const processoBaseUrl = anexo.numeroProcesso
      ? `/api/nugecid/processo/${encodeURIComponent(anexo.numeroProcesso)}/anexos`
      : null;

    const base = {
      id: anexo.id,
      desarquivamentoId: anexo.desarquivamentoId,
      numeroProcesso: anexo.numeroProcesso,
      usuarioId: anexo.usuarioId,
      nomeOriginal: anexo.nomeOriginal,
      nomeArquivo: anexo.nomeArquivo,
      tipoMime: anexo.tipoMime,
      tamanhoBytes: anexo.tamanhoBytes,
      descricao: anexo.descricao,
      tipoAnexo: anexo.tipoAnexo,
      tipoVinculo: anexo.getTipoVinculo(),
      createdAt: anexo.createdAt,
      usuario: anexo.usuario,
      ocr: {
        status: anexo.ocrStatus || null,
        processedAt: anexo.ocrProcessedAt || null,
        searchablePdfAvailable: Boolean(anexo.ocrPdfPath),
        textAvailable: Boolean(anexo.ocrTextPath),
        signedPdfSkipped: anexo.ocrStatus === "skipped_signed",
        error: anexo.ocrError || null,
        analysisUrl: anexo.desarquivamentoId
          ? `/api/nugecid/${anexo.desarquivamentoId}/anexos/${anexo.id}/ocr`
          : processoBaseUrl
            ? `${processoBaseUrl}/${anexo.id}/ocr`
            : null,
      },
    };

    // Usar a rota da API para visualização, que já tem controle de acesso
    const url = anexo.desarquivamentoId
      ? `/api/nugecid/${anexo.desarquivamentoId}/anexos/${anexo.id}/download`
      : processoBaseUrl
        ? `${processoBaseUrl}/${anexo.id}/download`
        : undefined;
    const previewUrl =
      anexo.isImage() || anexo.isPdf()
        ? anexo.desarquivamentoId
          ? `/api/nugecid/${anexo.desarquivamentoId}/anexos/${anexo.id}/view`
          : processoBaseUrl
            ? `${processoBaseUrl}/${anexo.id}/view`
            : undefined
        : undefined;

    return {
      ...base,
      url,
      previewUrl,
    };
  }

  async findAnexosByDesarquivamento(
    desarquivamentoId: number,
    user: User,
    tipoAnexo?: "desarquivamento" | "rearquivamento",
  ): Promise<any[]> {
    const desarquivamento = await this.assertCanAccessDesarquivamento(
      desarquivamentoId,
      user,
    );

    const where: any[] = [];

    // Anexos da solicitação específica
    const whereSolicitacao: any = { desarquivamentoId };
    if (tipoAnexo) {
      whereSolicitacao.tipoAnexo = tipoAnexo;
    }
    where.push(whereSolicitacao);

    // Anexos do processo (se houver numeroProcesso)
    if (desarquivamento.numeroProcesso) {
      const whereProcesso: any = {
        numeroProcesso: desarquivamento.numeroProcesso,
      };
      if (tipoAnexo) {
        whereProcesso.tipoAnexo = tipoAnexo;
      }
      where.push(whereProcesso);
    }

    const anexos = await this.anexoRepository.find({
      where,
      order: { createdAt: "DESC" },
      take: 100,
    });

    return anexos.map((anexo) => this.mapAnexoResponse(anexo));
  }

  /**
   * Busca anexos de um processo (todas as solicitações)
   */
  async findAnexosByProcesso(
    numeroProcesso: string,
    user: User,
    tipoAnexo?: "desarquivamento" | "rearquivamento",
  ): Promise<any[]> {
    const normalizedNumeroProcesso = await this.assertCanAccessProcesso(
      numeroProcesso,
      user,
    );
    const where: any = { numeroProcesso: normalizedNumeroProcesso };
    if (tipoAnexo) {
      where.tipoAnexo = tipoAnexo;
    }

    const anexos = await this.anexoRepository.find({
      where,
      order: { createdAt: "DESC" },
      take: 100,
    });

    return anexos.map((anexo) => this.mapAnexoResponse(anexo));
  }

  async findAnexoById(id: number): Promise<DesarquivamentoAnexoTypeOrmEntity> {
    const anexo = await this.anexoRepository.findOne({
      where: { id },
      relations: ["usuario"],
    });

    if (!anexo) {
      throw new NotFoundException("Anexo não encontrado");
    }

    return anexo;
  }

  private async findAnexoByIdWithOcr(
    id: number,
  ): Promise<DesarquivamentoAnexoTypeOrmEntity> {
    const anexo = await this.anexoRepository
      .createQueryBuilder("anexo")
      .leftJoinAndSelect("anexo.usuario", "usuario")
      .addSelect("anexo.ocrTexto")
      .where("anexo.id = :id", { id })
      .getOne();

    if (!anexo) {
      throw new NotFoundException("Anexo não encontrado");
    }

    return anexo;
  }

  async getAnexoOcrAnalysis(id: number): Promise<AnexoOcrAnalysisResult> {
    const anexo = await this.findAnexoByIdWithOcr(id);
    const analysis = analyzeOcrTextForSignatures(anexo.ocrTexto);

    return {
      anexoId: anexo.id,
      nomeOriginal: anexo.nomeOriginal,
      tipoMime: anexo.tipoMime,
      ocrStatus: anexo.ocrStatus || null,
      processedAt: anexo.ocrProcessedAt || null,
      error: anexo.ocrError || null,
      searchablePdfAvailable: Boolean(anexo.ocrPdfPath),
      textAvailable: Boolean(anexo.ocrTextPath),
      rawText: analysis.rawText,
      possibleNames: analysis.possibleNames,
      signatures: analysis.signatures,
    };
  }

  async getAnexoOcrAnalysisByProcesso(
    id: number,
    numeroProcesso: string,
    user: User,
  ): Promise<AnexoOcrAnalysisResult> {
    const normalizedNumeroProcesso = await this.assertCanAccessProcesso(
      numeroProcesso,
      user,
    );
    const anexo = await this.findAnexoByIdWithOcr(id);

    if (anexo.numeroProcesso !== normalizedNumeroProcesso) {
      throw new NotFoundException("Anexo do processo não encontrado");
    }

    const analysis = analyzeOcrTextForSignatures(anexo.ocrTexto);

    return {
      anexoId: anexo.id,
      nomeOriginal: anexo.nomeOriginal,
      tipoMime: anexo.tipoMime,
      ocrStatus: anexo.ocrStatus || null,
      processedAt: anexo.ocrProcessedAt || null,
      error: anexo.ocrError || null,
      searchablePdfAvailable: Boolean(anexo.ocrPdfPath),
      textAvailable: Boolean(anexo.ocrTextPath),
      rawText: analysis.rawText,
      possibleNames: analysis.possibleNames,
      signatures: analysis.signatures,
    };
  }

  async getAnexoOcrAnalysisByDesarquivamento(
    id: number,
    desarquivamentoId: number,
    user: User,
  ): Promise<AnexoOcrAnalysisResult> {
    await this.assertCanAccessDesarquivamento(desarquivamentoId, user);

    const anexo = await this.findAnexoByIdWithOcrForDesarquivamento(
      id,
      desarquivamentoId,
    );
    const analysis = analyzeOcrTextForSignatures(anexo.ocrTexto);

    return {
      anexoId: anexo.id,
      nomeOriginal: anexo.nomeOriginal,
      tipoMime: anexo.tipoMime,
      ocrStatus: anexo.ocrStatus || null,
      processedAt: anexo.ocrProcessedAt || null,
      error: anexo.ocrError || null,
      searchablePdfAvailable: Boolean(anexo.ocrPdfPath),
      textAvailable: Boolean(anexo.ocrTextPath),
      rawText: analysis.rawText,
      possibleNames: analysis.possibleNames,
      signatures: analysis.signatures,
    };
  }

  private resolveAnexoLegacyPath(caminhoArquivo: string): string | undefined {
    if (!path.isAbsolute(caminhoArquivo)) return undefined;
    const storageRoot = path.resolve(process.cwd(), "uploads");
    const absolutePath = path.resolve(caminhoArquivo);
    if (
      !absolutePath.startsWith(storageRoot + path.sep) &&
      absolutePath !== storageRoot
    ) {
      throw new BadRequestException("Caminho de arquivo inválido.");
    }
    return absolutePath;
  }

  private async getAnexoObject(
    anexo: DesarquivamentoAnexoTypeOrmEntity,
  ): Promise<{
    buffer: Buffer;
    size: number;
    contentType?: string;
  }> {
    return this.storageService.getObject(anexo.caminhoArquivo, {
      legacyAbsolutePath: this.resolveAnexoLegacyPath(anexo.caminhoArquivo),
      contentType: anexo.tipoMime,
    });
  }

  private async getAnexoObjectStream(
    anexo: DesarquivamentoAnexoTypeOrmEntity,
  ): Promise<StorageObjectStream> {
    return this.storageService.getObjectStream(anexo.caminhoArquivo, {
      legacyAbsolutePath: this.resolveAnexoLegacyPath(anexo.caminhoArquivo),
      contentType: anexo.tipoMime,
    });
  }

  async downloadAnexoByDesarquivamento(
    id: number,
    desarquivamentoId: number,
    user: User,
  ): Promise<{
    arquivo: {
      buffer: Buffer;
      size: number;
      contentType?: string;
    };
    anexo: DesarquivamentoAnexoTypeOrmEntity;
  }> {
    await this.assertCanAccessDesarquivamento(desarquivamentoId, user);

    const anexo = await this.findAnexoByIdForDesarquivamento(
      id,
      desarquivamentoId,
    );
    const arquivo = await this.getAnexoObject(anexo);

    return { arquivo, anexo };
  }

  async streamAnexoByDesarquivamento(
    id: number,
    desarquivamentoId: number,
    user: User,
  ): Promise<{
    arquivo: StorageObjectStream;
    anexo: DesarquivamentoAnexoTypeOrmEntity;
  }> {
    await this.assertCanAccessDesarquivamento(desarquivamentoId, user);

    const anexo = await this.findAnexoByIdForDesarquivamento(
      id,
      desarquivamentoId,
    );
    const arquivo = await this.getAnexoObjectStream(anexo);

    return { arquivo, anexo };
  }

  async downloadAnexoByProcesso(
    id: number,
    numeroProcesso: string,
    user: User,
  ): Promise<{
    arquivo: {
      buffer: Buffer;
      size: number;
      contentType?: string;
    };
    anexo: DesarquivamentoAnexoTypeOrmEntity;
  }> {
    const normalizedNumeroProcesso = await this.assertCanAccessProcesso(
      numeroProcesso,
      user,
    );
    const anexo = await this.findAnexoById(id);

    if (anexo.numeroProcesso !== normalizedNumeroProcesso) {
      throw new NotFoundException("Anexo do processo não encontrado");
    }

    const arquivo = await this.getAnexoObject(anexo);

    return { arquivo, anexo };
  }

  async streamAnexoByProcesso(
    id: number,
    numeroProcesso: string,
    user: User,
  ): Promise<{
    arquivo: StorageObjectStream;
    anexo: DesarquivamentoAnexoTypeOrmEntity;
  }> {
    const normalizedNumeroProcesso = await this.assertCanAccessProcesso(
      numeroProcesso,
      user,
    );
    const anexo = await this.findAnexoById(id);

    if (anexo.numeroProcesso !== normalizedNumeroProcesso) {
      throw new NotFoundException("Anexo do processo não encontrado");
    }

    const arquivo = await this.getAnexoObjectStream(anexo);

    return { arquivo, anexo };
  }

  async deleteAnexo(id: number, user: User): Promise<void> {
    const anexo = await this.findAnexoById(id);

    // Verificar permissões (apenas o dono ou admin pode deletar)
    if (!user.isAdmin() && anexo.usuarioId !== user.id) {
      throw new BadRequestException(
        "Você não tem permissão para deletar este anexo",
      );
    }

    try {
      await this.storageService.deleteObject(anexo.caminhoArquivo, {
        legacyAbsolutePath: path.isAbsolute(anexo.caminhoArquivo)
          ? anexo.caminhoArquivo
          : undefined,
      });
    } catch (error) {
      this.logger.error("Erro ao remover arquivo:", error);
      // Não lançar erro aqui, continuar com a remoção do registro
    }

    await this.cleanupStoredObjects(undefined, {
      searchablePdfKey: anexo.ocrPdfPath,
      textKey: anexo.ocrTextPath,
    });

    // Remover registro do banco
    await this.anexoRepository.remove(anexo);

    this.logger.log(
      `Anexo removido: ${anexo.nomeOriginal} por ${user.usuario}`,
    );

    this.searchService?.requestSyncDesarquivamentoTargets({
      desarquivamentoId: anexo.desarquivamentoId,
      numeroProcesso: anexo.numeroProcesso,
    });
  }

  async deleteAnexoByDesarquivamento(
    id: number,
    desarquivamentoId: number,
    user: User,
  ): Promise<void> {
    await this.assertCanAccessDesarquivamento(desarquivamentoId, user);
    await this.findAnexoByIdForDesarquivamento(id, desarquivamentoId);
    await this.deleteAnexo(id, user);
  }

  private async cleanupStoredObjects(
    originalStorageKey?: string,
    ocrResult?: Pick<OcrProcessResult, "searchablePdfKey" | "textKey"> | null,
  ): Promise<void> {
    const keys = [
      originalStorageKey,
      ocrResult?.searchablePdfKey,
      ocrResult?.textKey,
    ].filter(Boolean) as string[];

    await Promise.all(
      keys.map((key) =>
        this.storageService.deleteObject(key).catch((error) => {
          this.logger.warn(
            `Falha ao limpar objeto ${key}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }),
      ),
    );
  }

  async updateAnexoDescricao(
    id: number,
    descricao: string,
    user: User,
  ): Promise<any> {
    const anexo = await this.findAnexoById(id);

    // Verificar permissões (apenas o dono ou admin/coordenador pode editar)
    if (
      !user.isAdmin() &&
      !user.isCoordenador() &&
      anexo.usuarioId !== user.id
    ) {
      throw new BadRequestException(
        "Você não tem permissão para editar este anexo",
      );
    }

    anexo.descricao = descricao;
    const updatedAnexo = await this.anexoRepository.save(anexo);

    this.logger.log(
      `Descrição de anexo atualizada: ${anexo.nomeOriginal} por ${user.usuario}`,
    );

    this.searchService?.requestSyncDesarquivamentoTargets({
      desarquivamentoId: updatedAnexo.desarquivamentoId,
      numeroProcesso: updatedAnexo.numeroProcesso,
    });

    return this.mapAnexoResponse(updatedAnexo);
  }

  async updateAnexoDescricaoByDesarquivamento(
    id: number,
    desarquivamentoId: number,
    descricao: string,
    user: User,
  ): Promise<any> {
    await this.assertCanAccessDesarquivamento(desarquivamentoId, user);
    await this.findAnexoByIdForDesarquivamento(id, desarquivamentoId);
    return this.updateAnexoDescricao(id, descricao, user);
  }

  private async findDesarquivamentoOrThrow(
    desarquivamentoId: number,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where: { id: desarquivamentoId },
    });

    if (!desarquivamento) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    return desarquivamento;
  }

  private async assertCanAccessDesarquivamento(
    desarquivamentoId: number,
    user: User,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    const desarquivamento =
      await this.findDesarquivamentoOrThrow(desarquivamentoId);

    if (!this.canAccessDesarquivamento(desarquivamento, user)) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    return desarquivamento;
  }

  private async assertCanAccessProcesso(
    numeroProcesso: string,
    user: User,
  ): Promise<string> {
    const normalizedNumeroProcesso = numeroProcesso.trim();
    const where: FindOptionsWhere<DesarquivamentoTypeOrmEntity>[] =
      this.hasFullNugecidAccess(user)
        ? [{ numeroProcesso: normalizedNumeroProcesso }]
        : [
            { numeroProcesso: normalizedNumeroProcesso, criadoPorId: user.id },
            {
              numeroProcesso: normalizedNumeroProcesso,
              responsavelId: user.id,
            },
          ];

    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where,
    });

    if (!desarquivamento) {
      throw new NotFoundException("Processo não encontrado");
    }

    return normalizedNumeroProcesso;
  }

  private canAccessDesarquivamento(
    desarquivamento: DesarquivamentoAccessRecord,
    user: User,
  ): boolean {
    return (
      this.hasFullNugecidAccess(user) ||
      desarquivamento.criadoPorId === user.id ||
      desarquivamento.responsavelId === user.id
    );
  }

  private hasFullNugecidAccess(user: User): boolean {
    if (user.isAdmin() || user.isCoordenador()) {
      return true;
    }

    const roleNames = [user.role?.name]
      .filter((roleName): roleName is string => Boolean(roleName))
      .map((roleName) => roleName.trim().toLowerCase());

    return roleNames.some((roleName) =>
      ["admin", "coordenador", "nugecid_viewer", "nugecid_operator"].includes(
        roleName,
      ),
    );
  }

  private buildStorageKey(fileName: string): string {
    return `${this.storagePrefix}/${fileName}`;
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > DEFAULT_DOCUMENT_UPLOAD_MAX_SIZE_BYTES) {
      throw new BadRequestException(
        "Arquivo muito grande. Tamanho máximo: 10MB",
      );
    }

    if (!FileValidator.isAllowedImageOrDocumentMimeType(file.mimetype)) {
      throw new BadRequestException(
        "Tipo de arquivo não permitido. Tipos aceitos: imagens, PDF, documentos Word/Excel e arquivos de texto.",
      );
    }
  }

  private async findAnexoByIdForDesarquivamento(
    id: number,
    desarquivamentoId: number,
  ): Promise<DesarquivamentoAnexoTypeOrmEntity> {
    const anexo = await this.findAnexoById(id);

    if (anexo.desarquivamentoId !== desarquivamentoId) {
      throw new NotFoundException(
        "Anexo não encontrado para este desarquivamento",
      );
    }

    return anexo;
  }

  private async findAnexoByIdWithOcrForDesarquivamento(
    id: number,
    desarquivamentoId: number,
  ): Promise<DesarquivamentoAnexoTypeOrmEntity> {
    const anexo = await this.findAnexoByIdWithOcr(id);

    if (anexo.desarquivamentoId !== desarquivamentoId) {
      throw new NotFoundException(
        "Anexo não encontrado para este desarquivamento",
      );
    }

    return anexo;
  }
}
