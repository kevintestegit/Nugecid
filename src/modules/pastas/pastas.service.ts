import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import * as XLSX from "xlsx";
import { Pasta } from "./entities/pasta.entity";
import {
  PastaArquivo,
  PastaArquivoTipo,
} from "./entities/pasta-arquivo.entity";
import { CreatePastaDto } from "./dto/create-pasta.dto";
import { UpdatePastaDto } from "./dto/update-pasta.dto";
import { NotificacoesService } from "../notificacoes/services";

interface PastaFilesPayload {
  imagens?: Express.Multer.File[];
  planilha?: Express.Multer.File[];
  planilhas?: Express.Multer.File[];
}

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "pastas");

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

@Injectable()
export class PastasService {
  private readonly logger = new Logger(PastasService.name);

  constructor(
    @InjectRepository(Pasta)
    private pastasRepository: Repository<Pasta>,
    @InjectRepository(PastaArquivo)
    private pastaArquivoRepository: Repository<PastaArquivo>,
    private readonly dataSource: DataSource,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  private schemaReady: Promise<void> | null = null;

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

    const pasta = this.pastasRepository.create({
      ...createPastaDto,
      id: randomUUID(),
      tags,
      imagens: 0,
      planilhas: 0,
    });

    await this.pastasRepository.save(pasta);

    await this.persistArquivos(pasta, files);

    const pastaCompleta = await this.findOne(pasta.id);

    try {
      await this.notificacoesService.notificarPastaCriada(
        usuarioId ?? null,
        pasta.id,
        pasta.nome,
      );
    } catch (error) {
      this.logger.warn("Falha ao enviar notifica��o de nova prateleira", {
        error,
      });
    }

    return pastaCompleta;
  }

  async findAll(): Promise<any[]> {
    await this.ensureSchema();
    const pastas = await this.pastasRepository.find({
      relations: ["arquivos"],
      order: { dataCriacao: "DESC" },
    });
    return pastas.map((pasta) => this.mapToResponse(pasta));
  }

  async findOne(id: string): Promise<any> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    return this.mapToResponse(pasta);
  }

  async update(id: string, updatePastaDto: UpdatePastaDto): Promise<any> {
    await this.ensureSchema();
    const payload: Partial<Pasta> = { ...updatePastaDto };
    if (updatePastaDto.tags !== undefined) {
      payload.tags = this.normalizeTags(updatePastaDto.tags);
    }
    await this.pastasRepository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.ensureSchema();
    const arquivos = await this.pastaArquivoRepository.find({
      where: { pastaId: id },
    });

    await Promise.all(
      arquivos.map((arquivo) => this.deleteArquivoDoDisco(arquivo.caminho)),
    );

    await this.pastaArquivoRepository.delete({ pastaId: id });
    await this.pastasRepository.delete(id);
  }

  async adicionarArquivos(id: string, files?: PastaFilesPayload): Promise<any> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOneBy({ id });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }

    await this.persistArquivos(pasta, files);
    return this.findOne(id);
  }

  async listarArquivos(pastaId: string): Promise<any[]> {
    await this.ensureSchema();
    const pasta = await this.pastasRepository.findOne({
      where: { id: pastaId },
      relations: ["arquivos"],
    });
    if (!pasta) {
      throw new NotFoundException("Pasta nao encontrada");
    }
    return (
      pasta.arquivos?.map((arquivo) =>
        this.mapArquivoResponse(pasta, arquivo),
      ) ?? []
    );
  }

  async listarItens(pastaId: string): Promise<{
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

    const pastas = await this.pastasRepository.find({
      relations: ["arquivos"],
    });

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
  ): Promise<{
    caminhoAbsoluto: string;
    nome: string;
    tipo: PastaArquivoTipo;
  }> {
    await this.ensureSchema();
    const arquivo = await this.pastaArquivoRepository.findOne({
      where: { id: arquivoId, pastaId },
    });
    if (!arquivo) {
      throw new NotFoundException("Arquivo nao encontrado");
    }

    const caminhoAbsoluto = path.join(UPLOAD_ROOT, arquivo.caminho);
    return {
      caminhoAbsoluto,
      nome: arquivo.nomeOriginal,
      tipo: arquivo.tipo,
    };
  }

  async removerArquivo(pastaId: string, arquivoId: string): Promise<any> {
    await this.ensureSchema();
    const arquivo = await this.pastaArquivoRepository.findOne({
      where: { id: arquivoId, pastaId },
    });
    if (!arquivo) {
      throw new NotFoundException("Arquivo nao encontrado");
    }

    await this.deleteArquivoDoDisco(arquivo.caminho);
    await this.pastaArquivoRepository.delete({ id: arquivoId });

    await this.recalcularContagensArquivos(pastaId);

    return this.findOne(pastaId);
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
    try {
      const caminho = path.join(UPLOAD_ROOT, arquivo.caminho);
      if (!existsSync(caminho)) {
        this.logger.warn(
          `Arquivo de planilha nao encontrado no disco: ${caminho}`,
        );
        return null;
      }

      const buffer = await fs.readFile(caminho);
      const workbook = XLSX.read(buffer, {
        type: "buffer",
        cellDates: false,
      });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return null;
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        return null;
      }

      const rawRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
        raw: false,
      }) as any[][];

      if (!rawRows.length) {
        return {
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          colunas: [],
          itens: [],
        };
      }

      const headerIndex = rawRows.findIndex(
        (row) =>
          Array.isArray(row) &&
          row.some(
            (valor) => valor !== undefined && String(valor ?? "").trim().length,
          ),
      );

      if (headerIndex === -1) {
        return {
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          colunas: [],
          itens: [],
        };
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
        return {
          planilhaId: arquivo.id,
          planilhaNome: arquivo.nomeOriginal,
          sheetName,
          colunas: [],
          itens: [],
        };
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

      return {
        planilhaId: arquivo.id,
        planilhaNome: arquivo.nomeOriginal,
        sheetName,
        colunas,
        itens,
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao processar planilha "${arquivo.nomeOriginal}" da pasta "${pasta.nome}": ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    }
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

    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const pastaDir = path.join(UPLOAD_ROOT, pasta.id);
    await fs.mkdir(pastaDir, { recursive: true });

    const arquivosParaSalvar: PastaArquivo[] = [];

    const salvarArquivo = async (
      file: Express.Multer.File,
      tipo: PastaArquivoTipo,
    ) => {
      const safeName = file.originalname.replace(/\s+/g, "_");
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`;
      const destino = path.join(pastaDir, filename);

      await fs.writeFile(destino, file.buffer);

      const relativePath = path.join(pasta.id, filename);

      arquivosParaSalvar.push(
        this.pastaArquivoRepository.create({
          pastaId: pasta.id,
          tipo,
          nomeOriginal: file.originalname,
          caminho: relativePath.replace(/\\/g, "/"),
          tamanhoBytes: file.size.toString(),
        }),
      );
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

  private async recalcularContagensArquivos(pastaId: string): Promise<void> {
    const [imagens, planilhas] = await Promise.all([
      this.pastaArquivoRepository.count({
        where: { pastaId, tipo: PastaArquivoTipo.IMAGEM },
      }),
      this.pastaArquivoRepository.count({
        where: { pastaId, tipo: PastaArquivoTipo.PLANILHA },
      }),
    ]);

    await this.pastasRepository.update(pastaId, {
      imagens,
      planilhas,
    });
  }

  private async deleteArquivoDoDisco(caminhoRelativo: string): Promise<void> {
    const caminho = path.join(UPLOAD_ROOT, caminhoRelativo);
    if (existsSync(caminho)) {
      await fs.unlink(caminho).catch(() => undefined);
    }
  }

  private mapToResponse(pasta: Pasta): any {
    return {
      ...pasta,
      arquivos:
        pasta.arquivos?.map((arquivo) =>
          this.mapArquivoResponse(pasta, arquivo),
        ) ?? [],
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
          ? `/uploads/pastas/${arquivo.caminho}`
          : undefined,
    };
  }
}
