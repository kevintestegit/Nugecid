import { Injectable } from "@nestjs/common";
import {
  SeiCapturaStatus,
  SeiCapturaValidacao,
  SeiRegistroCapturado,
} from "./sei-captura.types";

type RawSpreadsheetRow = Record<string, string>;

const HEADER_ALIASES = {
  numeroProcessoSei: [
    "processo",
    "numero processo",
    "numero do processo",
    "n processo",
    "nº processo",
    "processo sei",
    "numero processo sei",
    "numero_processo_sei",
  ],
  numeroPci: ["pci", "numero pci", "n pci", "nº pci", "numero_pci"],
  dataEntradaSei: [
    "data",
    "data entrada",
    "data de entrada",
    "data recebimento",
    "recebido em",
  ],
  unidadeOrigem: [
    "unidade origem",
    "origem",
    "setor origem",
    "unidade remetente",
  ],
  unidadeAtual: ["unidade atual", "unidade", "setor atual", "localizacao"],
  interessado: [
    "interessado",
    "requerente",
    "solicitante",
    "nome",
    "nome interessado",
  ],
  assunto: ["assunto", "descricao", "descrição", "objeto"],
  tipoProcesso: ["tipo", "tipo processo", "tipo de processo", "procedimento"],
  textoResumo: ["resumo", "observacao", "observação", "andamento", "detalhes"],
  linkSei: ["link", "url", "link sei", "processo url"],
} satisfies Record<keyof SeiRegistroCapturado, string[]>;

@Injectable()
export class SeiCapturaMapperService {
  mapRow(row: RawSpreadsheetRow): SeiRegistroCapturado {
    const normalizedRow = this.normalizeRowKeys(row);
    const textoResumo = this.pick(normalizedRow, HEADER_ALIASES.textoResumo);
    const assunto = this.pick(normalizedRow, HEADER_ALIASES.assunto);

    return {
      numeroProcessoSei: this.normalizeNullable(
        this.pick(normalizedRow, HEADER_ALIASES.numeroProcessoSei),
      ),
      numeroPci: this.extractNumeroPci(
        this.pick(normalizedRow, HEADER_ALIASES.numeroPci) ??
          assunto ??
          textoResumo ??
          "",
      ),
      dataEntradaSei: this.parseDate(
        this.pick(normalizedRow, HEADER_ALIASES.dataEntradaSei),
      ),
      unidadeOrigem: this.normalizeNullable(
        this.pick(normalizedRow, HEADER_ALIASES.unidadeOrigem),
      ),
      unidadeAtual: this.normalizeNullable(
        this.pick(normalizedRow, HEADER_ALIASES.unidadeAtual),
      ),
      interessado: this.normalizeNullable(
        this.pick(normalizedRow, HEADER_ALIASES.interessado),
      ),
      assunto: this.normalizeNullable(assunto),
      tipoProcesso: this.normalizeNullable(
        this.pick(normalizedRow, HEADER_ALIASES.tipoProcesso),
      ),
      textoResumo: this.normalizeNullable(textoResumo),
      linkSei: this.normalizeNullable(
        this.pick(normalizedRow, HEADER_ALIASES.linkSei),
      ),
    };
  }

  validate(registro: SeiRegistroCapturado): SeiCapturaValidacao {
    const camposAusentes: string[] = [];

    if (!registro.numeroProcessoSei) camposAusentes.push("numeroProcessoSei");
    if (!registro.dataEntradaSei) camposAusentes.push("dataEntradaSei");
    if (!registro.interessado) camposAusentes.push("interessado");
    if (!registro.assunto && !registro.tipoProcesso && !registro.textoResumo) {
      camposAusentes.push("assuntoOuTipo");
    }

    if (camposAusentes.length) {
      return {
        status: SeiCapturaStatus.INCOMPLETO,
        motivo: `Campos ausentes: ${camposAusentes.join(", ")}`,
        camposAusentes,
      };
    }

    return {
      status: SeiCapturaStatus.PRONTO_PARA_IMPORTAR,
      motivo: null,
      camposAusentes: [],
    };
  }

  private normalizeRowKeys(row: RawSpreadsheetRow): RawSpreadsheetRow {
    return Object.entries(row).reduce<RawSpreadsheetRow>(
      (acc, [key, value]) => {
        acc[this.normalizeHeader(key)] = String(value ?? "").trim();
        return acc;
      },
      {},
    );
  }

  private pick(
    row: RawSpreadsheetRow,
    aliases: readonly string[],
  ): string | null {
    for (const alias of aliases) {
      const value = row[this.normalizeHeader(alias)];
      if (value?.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private normalizeHeader(value: string): string {
    return value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  private normalizeNullable(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private parseDate(value: string | null): Date | null {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const brazilianDate = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brazilianDate) {
      const [, day, month, year] = brazilianDate;
      const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private extractNumeroPci(value: string): string | null {
    const match = value.match(/\bPCI[-\s:]*(\d[\d./-]*)/i);
    if (!match) return null;
    return `PCI ${match[1].trim()}`;
  }
}
