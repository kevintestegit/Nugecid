import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { randomUUID } from "crypto";
import { join } from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import * as XLSX from "xlsx";
import { PlanilhaControle } from "./entities/planilha-controle.entity";
import {
  PastasService,
  ParsedPlanilha,
  PastaItemRow,
} from "../pastas/pastas.service";

export interface PlanilhaControleResponse {
  id: string;
  nomeOriginal: string;
  tamanhoBytes: number;
  dataUpload: Date;
  url: string;
}

export interface PlanilhaGeralLinha {
  [coluna: string]: string;
}

export interface PlanilhaGeralGrupo {
  pastaId: string;
  pastaNome: string;
  totalPlanilhas: number;
  totalItens: number;
  planilhas: Array<{
    planilhaId: string;
    planilhaNome: string;
    sheetName: string;
    totalItens: number;
  }>;
}

export interface PlanilhaGeralResumo {
  totalPastas: number;
  totalPlanilhas: number;
  totalItens: number;
  colunas: string[];
  linhas: PlanilhaGeralLinha[];
  grupos: PlanilhaGeralGrupo[];
}

@Injectable()
export class PlanilhasService {
  private readonly logger = new Logger(PlanilhasService.name);
  private readonly uploadDir = join(process.cwd(), "uploads", "planilhas");
  private schemaReady: Promise<void> | null = null;

  constructor(
    @InjectRepository(PlanilhaControle)
    private readonly planilhasRepository: Repository<PlanilhaControle>,
    private readonly dataSource: DataSource,
    private readonly pastasService: PastasService,
  ) {}

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
      const hasTable = await queryRunner.hasTable("planilhas_controle");
      if (!hasTable) {
        await queryRunner.query(`
          CREATE TABLE "planilhas_controle" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "nome_original" VARCHAR(255) NOT NULL,
            "caminho" VARCHAR(512) NOT NULL,
            "tamanho_bytes" BIGINT NOT NULL,
            "data_upload" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await queryRunner.query(
          `CREATE INDEX "IDX_planilhas_controle_data_upload" ON "planilhas_controle" ("data_upload");`,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  async create(file?: Express.Multer.File): Promise<PlanilhaControleResponse> {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo de planilha foi enviado.");
    }

    await this.ensureSchema();
    await fs.mkdir(this.uploadDir, { recursive: true });

    const safeName = file.originalname.replace(/\s+/g, "_");
    const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
    const destino = join(this.uploadDir, filename);

    await fs.writeFile(destino, file.buffer);

    const planilha = this.planilhasRepository.create({
      nomeOriginal: file.originalname,
      caminho: filename,
      tamanhoBytes: file.size.toString(),
    });

    await this.planilhasRepository.save(planilha);

    this.logger.log(
      `Planilha geral salva com sucesso: ${planilha.id} (${planilha.nomeOriginal})`,
    );

    return this.mapToResponse(planilha);
  }

  async findAll(): Promise<PlanilhaControleResponse[]> {
    await this.ensureSchema();
    const registros = await this.planilhasRepository.find({
      order: { dataUpload: "DESC" },
    });
    return registros.map((planilha) => this.mapToResponse(planilha));
  }

  async remove(id: string): Promise<void> {
    await this.ensureSchema();
    const planilha = await this.planilhasRepository.findOne({
      where: { id },
    });

    if (!planilha) {
      throw new NotFoundException("Planilha nao encontrada.");
    }

    await this.planilhasRepository.delete(planilha.id);

    const caminhoAbsoluto = join(this.uploadDir, planilha.caminho);
    if (existsSync(caminhoAbsoluto)) {
      await fs.unlink(caminhoAbsoluto).catch((err) => {
        this.logger.warn(
          `Nao foi possivel remover o arquivo fisico da planilha ${id}: ${err.message}`,
        );
      });
    }
  }

  async obterArquivo(
    id: string,
  ): Promise<{ registro: PlanilhaControle; caminhoAbsoluto: string }> {
    await this.ensureSchema();
    const registro = await this.planilhasRepository.findOne({
      where: { id },
    });

    if (!registro) {
      throw new NotFoundException("Planilha nao encontrada.");
    }

    const caminhoAbsoluto = join(this.uploadDir, registro.caminho);
    if (!existsSync(caminhoAbsoluto)) {
      throw new NotFoundException(
        "Arquivo fisico da planilha nao foi localizado.",
      );
    }

    return { registro, caminhoAbsoluto };
  }

  async obterPlanilhaGeral(): Promise<PlanilhaGeralResumo> {
    await this.ensureSchema();

    const pastas = await this.pastasService.findAll();
    if (!pastas.length) {
      return {
        totalPastas: 0,
        totalPlanilhas: 0,
        totalItens: 0,
        colunas: [],
        linhas: [],
        grupos: [],
      };
    }

    const detalhes = await Promise.all(
      pastas.map(async (pasta) => {
        try {
          return await this.pastasService.listarItens(pasta.id);
        } catch (error) {
          this.logger.warn(
            `Falha ao carregar planilhas da pasta ${pasta.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          return null;
        }
      }),
    );

    const colunasBase = ["Pasta", "Planilha", "Linha", "Destaque"];
    const colunasSet = new Set<string>(colunasBase);
    const linhas: PlanilhaGeralLinha[] = [];
    const grupos: PlanilhaGeralGrupo[] = [];

    let totalPlanilhas = 0;
    let totalItens = 0;

    detalhes.forEach((detalhe, index) => {
      if (!detalhe) {
        return;
      }

      const pastaInfo = pastas[index];
      const grupo: PlanilhaGeralGrupo = {
        pastaId: pastaInfo.id,
        pastaNome: pastaInfo.nome,
        totalPlanilhas: detalhe.planilhas.length,
        totalItens: detalhe.planilhas.reduce(
          (acc, planilha) => acc + planilha.itens.length,
          0,
        ),
        planilhas: [],
      };

      totalPlanilhas += detalhe.planilhas.length;

      detalhe.planilhas.forEach((planilha) => {
        this.collectColunas(planilha, colunasSet);

        grupo.planilhas.push({
          planilhaId: planilha.planilhaId,
          planilhaNome: planilha.planilhaNome,
          sheetName: planilha.sheetName,
          totalItens: planilha.itens.length,
        });

        planilha.itens.forEach((item) => {
          linhas.push(
            this.mapItemParaLinha(item, planilha, pastaInfo.nome, colunasBase),
          );
          totalItens += 1;
        });
      });

      if (grupo.planilhas.length) {
        grupo.planilhas.sort((aPlanilha, bPlanilha) => {
          const ordemA = this.extractNumeroOrdenacao(aPlanilha.planilhaNome);
          const ordemB = this.extractNumeroOrdenacao(bPlanilha.planilhaNome);
          if (ordemA !== ordemB) {
            return ordemA - ordemB;
          }
          return aPlanilha.planilhaNome.localeCompare(
            bPlanilha.planilhaNome,
            "pt-BR",
            {
              numeric: true,
              sensitivity: "base",
            },
          );
        });
        grupos.push(grupo);
      }
    });

    const colunasOrdenadas = this.ordenarColunas(colunasSet, colunasBase);
    const linhasOrdenadas = linhas.map((linha) => {
      const ordenada: PlanilhaGeralLinha = {};
      colunasOrdenadas.forEach((coluna) => {
        ordenada[coluna] = linha[coluna] ?? "";
      });
      return ordenada;
    });

    linhasOrdenadas.sort((a, b) => {
      const pastaNumeroA = this.extractNumeroOrdenacao(a.Pasta);
      const pastaNumeroB = this.extractNumeroOrdenacao(b.Pasta);
      if (pastaNumeroA !== pastaNumeroB) {
        return pastaNumeroA - pastaNumeroB;
      }

      const planilhaCompare = (a.Planilha || "").localeCompare(
        b.Planilha || "",
        "pt-BR",
        { numeric: true, sensitivity: "base" },
      );
      if (planilhaCompare !== 0) {
        return planilhaCompare;
      }

      const linhaA = Number.parseInt(a.Linha ?? "0", 10);
      const linhaB = Number.parseInt(b.Linha ?? "0", 10);
      return linhaA - linhaB;
    });

    grupos.sort((a, b) => {
      const ordemA = this.extractNumeroOrdenacao(a.pastaNome);
      const ordemB = this.extractNumeroOrdenacao(b.pastaNome);
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      return a.pastaNome.localeCompare(b.pastaNome, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    });

    const resumo: PlanilhaGeralResumo = {
      totalPastas: grupos.length,
      totalPlanilhas,
      totalItens,
      colunas: colunasOrdenadas,
      linhas: linhasOrdenadas,
      grupos,
    };

    if (!resumo.totalItens) {
      const fallback = await this.carregarPlanilhaControleFallback();
      if (fallback) {
        return fallback;
      }
    }

    return resumo;
  }

  private async carregarPlanilhaControleFallback(): Promise<PlanilhaGeralResumo | null> {
    const registro = await this.planilhasRepository.findOne({
      order: { dataUpload: "DESC" },
    });

    if (!registro) {
      return null;
    }

    const caminhoAbsoluto = join(this.uploadDir, registro.caminho);
    if (!existsSync(caminhoAbsoluto)) {
      this.logger.warn(
        `Arquivo da planilha de controle nao encontrado: ${caminhoAbsoluto}`,
      );
      return null;
    }

    const buffer = await fs.readFile(caminhoAbsoluto);
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
      return null;
    }

    const headerIndex = rawRows.findIndex(
      (row) =>
        Array.isArray(row) &&
        row.some(
          (valor) => valor !== undefined && String(valor ?? "").trim().length,
        ),
    );

    if (headerIndex === -1) {
      return null;
    }

    const headerRow = Array.isArray(rawRows[headerIndex])
      ? rawRows[headerIndex].map((coluna) => String(coluna ?? "").trim())
      : [];
    const normalizedHeaders = Array.from(
      new Set(["Pasta", "Planilha", "Linha", ...headerRow]),
    );

    const dataRows = rawRows
      .slice(headerIndex + 1)
      .filter(
        (row) =>
          Array.isArray(row) &&
          row.some(
            (valor) => valor !== undefined && String(valor ?? "").trim().length,
          ),
      );

    if (!headerRow.length || !dataRows.length) {
      return null;
    }

    const linhas = dataRows.map((row, index) => {
      const linha: PlanilhaGeralLinha = {};
      normalizedHeaders.forEach((coluna, colIndex) => {
        if (headerRow.includes(coluna)) {
          const idx = headerRow.indexOf(coluna);
          linha[coluna] =
            row[idx] !== undefined && row[idx] !== null
              ? String(row[idx])
              : "";
        } else {
          linha[coluna] = "";
        }
      });

      const pastaValor =
        (pastaColumn &&
          row[headerRow.indexOf(pastaColumn)] &&
          String(row[headerRow.indexOf(pastaColumn)])) ||
        "";
      linha.Pasta = pastaValor || registro.nomeOriginal || "Planilha Geral";
      linha.Planilha = linha.Planilha || registro.nomeOriginal || "Planilha Geral";
      linha.Linha = (headerIndex + 1 + index).toString();

      return linha;
    });

    const pastaColumn = headerRow.find((coluna) =>
      coluna.toLowerCase().includes("pasta"),
    );

    const gruposMap = new Map<
      string,
      { totalItens: number; pastaNome: string }
    >();

    if (pastaColumn) {
      linhas.forEach((linha) => {
        const chave = (linha[pastaColumn] ?? "").trim() || "Pasta";
        const atual = gruposMap.get(chave) ?? {
          totalItens: 0,
          pastaNome: chave,
        };
        gruposMap.set(chave, {
          totalItens: atual.totalItens + 1,
          pastaNome: chave,
        });
      });
    } else {
      gruposMap.set(registro.id, {
        totalItens: linhas.length,
        pastaNome: registro.nomeOriginal || "Planilha Geral",
      });
    }

    const grupos: PlanilhaGeralGrupo[] = Array.from(gruposMap.entries()).map(
      ([key, value]) => ({
        pastaId: key,
        pastaNome: value.pastaNome,
        totalPlanilhas: 1,
        totalItens: value.totalItens,
        planilhas: [
          {
            planilhaId: registro.id,
            planilhaNome: registro.nomeOriginal,
            sheetName,
            totalItens: value.totalItens,
          },
        ],
      }),
    );

    grupos.sort((a, b) => {
      const ordemA = this.extractNumeroOrdenacao(a.pastaNome);
      const ordemB = this.extractNumeroOrdenacao(b.pastaNome);
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      return a.pastaNome.localeCompare(b.pastaNome, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    });

    grupos.forEach((grupo) => {
      grupo.planilhas.sort((aPlanilha, bPlanilha) => {
        const ordemA = this.extractNumeroOrdenacao(aPlanilha.planilhaNome);
        const ordemB = this.extractNumeroOrdenacao(bPlanilha.planilhaNome);
        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }
        return aPlanilha.planilhaNome.localeCompare(
          bPlanilha.planilhaNome,
          "pt-BR",
          { numeric: true, sensitivity: "base" },
        );
      });
    });

    return {
      totalPastas: grupos.length,
      totalPlanilhas: 1,
      totalItens: linhas.length,
      colunas: normalizedHeaders,
      linhas,
      grupos,
    };
  }

  private collectColunas(
    planilha: ParsedPlanilha,
    colunasSet: Set<string>,
  ): void {
    planilha.colunas.forEach((coluna) => {
      if (coluna && coluna.trim().length) {
        colunasSet.add(coluna.trim());
      }
    });

    planilha.itens.forEach((item) => {
      Object.keys(item.valores ?? {}).forEach((coluna) => {
        if (coluna && coluna.trim().length) {
          colunasSet.add(coluna.trim());
        }
      });
    });
  }

  private mapItemParaLinha(
    item: PastaItemRow,
    planilha: ParsedPlanilha,
    pastaNome: string,
    colunasBase: string[],
  ): PlanilhaGeralLinha {
    const linha: PlanilhaGeralLinha = {};

    linha.Pasta = pastaNome || item.pastaNome || "";
    linha.Planilha = planilha.planilhaNome || "Planilha";
    linha.Linha = String(item.linha ?? "");
    linha.Destaque = item.destaque ?? "";

    const valores = item.valores ?? {};
    Object.entries(valores).forEach(([coluna, valor]) => {
      if (coluna && coluna.trim().length) {
        linha[coluna.trim()] = valor ?? "";
      }
    });

    colunasBase.forEach((coluna) => {
      if (linha[coluna] === undefined) {
        linha[coluna] = "";
      }
    });

    return linha;
  }

  private ordenarColunas(
    colunasSet: Set<string>,
    colunasBase: string[],
  ): string[] {
    const extras = Array.from(colunasSet).filter(
      (coluna) => !colunasBase.includes(coluna),
    );

    extras.sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }),
    );

    return [...colunasBase, ...extras];
  }

  private extractNumeroOrdenacao(valor?: string): number {
    if (!valor) {
      return Number.POSITIVE_INFINITY;
    }

    const match = valor.match(/\d+/);
    if (!match) {
      return Number.POSITIVE_INFINITY;
    }

    const numero = Number.parseInt(match[0], 10);
    if (Number.isNaN(numero)) {
      return Number.POSITIVE_INFINITY;
    }

    return numero;
  }

  private mapToResponse(planilha: PlanilhaControle): PlanilhaControleResponse {
    return {
      id: planilha.id,
      nomeOriginal: planilha.nomeOriginal,
      tamanhoBytes: Number(planilha.tamanhoBytes),
      dataUpload: planilha.dataUpload,
      url: `/api/planilhas/${planilha.id}/download`,
    };
  }
}
