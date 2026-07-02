import { Injectable, Logger } from "@nestjs/common";
import { validate } from "class-validator";
import {
  ImportRegistroDto,
  TipoDesarquivamento,
  StatusDesarquivamento,
} from "../../../dto/import-registro.dto";
import { readSpreadsheetObjects } from "../../../../../common/utils/spreadsheet.util";

export interface ImportRegistrosRequest {
  file: Express.Multer.File;
  userId: number;
}

export interface ImportRegistrosResponse {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    data: any;
    errors: Array<{
      property: string;
      constraints: Record<string, string>;
    }>;
  }>;
  summary: {
    message: string;
    details: string;
  };
}

@Injectable()
export class ImportRegistrosUseCase {
  private readonly logger = new Logger(ImportRegistrosUseCase.name);

  async execute(
    request: ImportRegistrosRequest,
  ): Promise<ImportRegistrosResponse> {
    this.logger.log(
      `Iniciando importação de registros pelo usuário ${request.userId}`,
    );

    // Validar arquivo
    await this.validateFile(request.file);

    // Processar planilha
    const { rows: data } = await readSpreadsheetObjects(
      request.file.buffer,
      request.file.originalname,
    );

    const totalRows = data.length;
    let successCount = 0;
    const errors = [];

    this.logger.log(`Processando ${totalRows} linhas da planilha`);

    // Processar cada linha
    for (let i = 0; i < totalRows; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 para corresponder à linha da planilha (cabeçalho + 1-based index)

      try {
        // Mapear dados da linha para o DTO
        const registroDto = await this.mapRowToDto(row);

        // Validar DTO
        const validationErrors = await validate(registroDto);

        if (validationErrors.length > 0) {
          errors.push({
            row: rowNumber,
            data: row,
            errors: validationErrors.map((err) => ({
              property: err.property,
              constraints: err.constraints || {},
            })),
          });
        } else {
          // Simular salvamento (aqui você integraria com o repositório)
          await this.saveRegistro(registroDto, request.userId);
          successCount++;
        }
      } catch (error) {
        this.logger.error(`Erro ao processar linha ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          data: row,
          errors: [
            {
              property: "processing",
              constraints: {
                error: error.message || "Erro desconhecido ao processar linha",
              },
            },
          ],
        });
      }
    }

    const response: ImportRegistrosResponse = {
      totalRows,
      successCount,
      errorCount: errors.length,
      errors,
      summary: {
        message: this.generateSummaryMessage(
          totalRows,
          successCount,
          errors.length,
        ),
        details: this.generateSummaryDetails(
          totalRows,
          successCount,
          errors.length,
        ),
      },
    };

    this.logger.log(
      `Importação concluída: ${successCount}/${totalRows} registros importados com sucesso`,
    );
    return response;
  }

  private async validateFile(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new Error("Arquivo não fornecido");
    }

    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/csv", // .csv
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Formato de arquivo não suportado. Use .xlsx ou .csv");
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("Arquivo muito grande. Tamanho máximo permitido: 10MB");
    }
  }

  private async mapRowToDto(row: any): Promise<ImportRegistroDto> {
    const dto = new ImportRegistroDto();

    // Mapear campos obrigatórios
    dto.desarquivamentoTipo = this.mapTipoDesarquivamento(
      row["DESARQUIVAMENTO FÍSICO/DIGITAL"] || row["desarquivamentoTipo"],
    );
    dto.status = this.mapStatusDesarquivamento(row["Status"] || row["status"]);
    dto.nomeCompleto = this.sanitizeString(
      row["Nome Completo"] || row["nomeCompleto"],
    );
    dto.numDocumento = this.sanitizeString(
      row["Nº DO NIC/LAUDO/AUTO/INFORMAÇÃO TÉCNICA"] || row["numDocumento"],
    );
    dto.dataSolicitacao = this.formatDate(
      row["Data de solicitação"] || row["dataSolicitacao"],
    );

    // Mapear campos opcionais
    dto.numProcesso = this.sanitizeString(
      row["Nº do Processo"] || row["numProcesso"],
    );
    dto.tipoDocumento = this.sanitizeString(
      row["Tipo do Documento"] || row["tipoDocumento"],
    );
    dto.dataDesarquivamento = this.formatDate(
      row["Data do desarquivamento - SAG"] || row["dataDesarquivamento"],
    );
    dto.dataDevolucao = this.formatDate(
      row["Data da devolução pelo setor"] || row["dataDevolucao"],
    );
    dto.setorDemandante = this.sanitizeString(
      row["Setor Demandante"] || row["setorDemandante"],
    );
    dto.servidorResponsavel = this.sanitizeString(
      row["Servidor Responsável"] || row["servidorResponsavel"],
    );
    dto.finalidade = this.sanitizeString(
      row["Finalidade"] || row["finalidade"],
    );
    dto.prorrogacao = this.mapBoolean(row["Prorrogação"] || row["prorrogacao"]);

    return dto;
  }

  private mapTipoDesarquivamento(value: any): TipoDesarquivamento {
    if (!value) return null;

    const normalizedValue = String(value).trim();

    switch (normalizedValue.toLowerCase()) {
      case "físico":
      case "fisico":
        return TipoDesarquivamento.FISICO;
      case "digital":
        return TipoDesarquivamento.DIGITAL;
      case "não localizado":
      case "nao localizado":
        return TipoDesarquivamento.NAO_LOCALIZADO;
      default:
        throw new Error(`Tipo de desarquivamento inválido: ${normalizedValue}`);
    }
  }

  private mapStatusDesarquivamento(value: any): StatusDesarquivamento {
    if (!value) return null;

    const normalizedValue = String(value).trim();

    switch (normalizedValue.toLowerCase()) {
      case "finalizado":
        return StatusDesarquivamento.FINALIZADO;
      case "desarquivado":
        return StatusDesarquivamento.DESARQUIVADO;
      case "não coletado":
      case "nao coletado":
        return StatusDesarquivamento.NAO_COLETADO;
      case "solicitado":
        return StatusDesarquivamento.SOLICITADO;
      case "rearquivamento solicitado":
        return StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO;
      case "retirado pelo setor":
        return StatusDesarquivamento.RETIRADO_PELO_SETOR;
      case "não localizado":
      case "nao localizado":
        return StatusDesarquivamento.NAO_LOCALIZADO;
      default:
        throw new Error(
          `Status de desarquivamento inválido: ${normalizedValue}`,
        );
    }
  }

  private sanitizeString(value: any): string {
    if (!value) return undefined;
    return String(value).trim();
  }

  private formatDate(value: any): string {
    if (!value) return undefined;

    try {
      let date: Date;

      if (value instanceof Date) {
        date = value;
      } else if (typeof value === "string") {
        date = new Date(value);
      } else if (typeof value === "number") {
        // Excel serial date
        date = new Date((value - 25569) * 86400 * 1000);
      } else {
        throw new Error("Formato de data não reconhecido");
      }

      if (isNaN(date.getTime())) {
        throw new Error("Data inválida");
      }

      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    } catch (error) {
      throw new Error(`Erro ao formatar data: ${error.message}`);
    }
  }

  private mapBoolean(value: any): boolean {
    if (value === undefined || value === null) return false;

    if (typeof value === "boolean") return value;

    const normalizedValue = String(value).toLowerCase().trim();
    return ["sim", "yes", "true", "1", "verdadeiro"].includes(normalizedValue);
  }

  private async saveRegistro(
    _dto: ImportRegistroDto,
    _userId: number,
  ): Promise<void> {
    // Aqui você integraria com o repositório para salvar o registro
    // Por enquanto, apenas simula o salvamento
    // LGPD: nomeCompleto e numDocumento nao sao registrados em logs.
    this.logger.debug(`Salvando registro importado`);

    // Simular delay de salvamento
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  private generateSummaryMessage(
    total: number,
    success: number,
    errors: number,
  ): string {
    if (errors === 0) {
      return `Importação concluída com sucesso! Todos os ${total} registros foram importados.`;
    } else if (success === 0) {
      return `Falha na importação! Nenhum registro foi importado devido a erros.`;
    } else {
      return `Importação parcialmente concluída. ${success} de ${total} registros foram importados com sucesso.`;
    }
  }

  private generateSummaryDetails(
    total: number,
    success: number,
    errors: number,
  ): string {
    const details = [];

    details.push(`Total de linhas processadas: ${total}`);
    details.push(`Registros importados com sucesso: ${success}`);

    if (errors > 0) {
      details.push(`Registros com erro: ${errors}`);
      details.push(
        "Verifique os detalhes dos erros abaixo para corrigir os dados e tentar novamente.",
      );
    }

    return details.join("\n");
  }
}
