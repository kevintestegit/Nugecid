import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";

import { User } from "../users/entities/user.entity";
import { CreateDesarquivamentoDto } from "./dto/create-desarquivamento.dto";
import { ImportResultDto } from "./dto/import-result.dto";
import { NugecidService } from "./nugecid.service";
import { TipoDesarquivamentoEnum } from "./domain/value-objects/tipo-desarquivamento.vo";
import { StatusDesarquivamentoEnum } from "./domain/enums/status-desarquivamento.enum";

@Injectable()
export class NugecidImportService {
  private readonly logger = new Logger(NugecidImportService.name);
  private readonly BATCH_SIZE = 100;

  constructor(
    private readonly nugecidService: NugecidService,
    private readonly dataSource: DataSource,
  ) {}

  async importFromXLSX(
    file: Express.Multer.File,
    currentUser: User,
  ): Promise<ImportResultDto> {
    return this.importRegistrosFromXLSX(file, currentUser);
  }

  /**
   * Normaliza strings: remove acentos, converte para uppercase e trim
   * Usado para padronizar entrada conforme backend espera
   */
  private normalize(value: string): string {
    if (!value) return "";
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }

  async importRegistrosFromXLSX(
    file: Express.Multer.File,
    currentUser: User,
  ): Promise<ImportResultDto> {
    // Validações iniciais
    if (!file) {
      throw new BadRequestException("Arquivo não enviado.");
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException("O arquivo enviado está vazio.");
    }

    this.logger.log(
      `📁 Iniciando importação: ${file.originalname} (${file.size} bytes)`,
    );

    try {
      const XLSX = this.getXlsx();
      // Ler arquivo Excel
      const workbook = XLSX.read(file.buffer, {
        type: "buffer",
        cellDates: true,
        dateNF: "yyyy-mm-dd",
      });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException(
          "O arquivo não contém planilhas válidas.",
        );
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        throw new BadRequestException("A planilha está vazia.");
      }

      // Converter para JSON (array de arrays)
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false, // Converter tudo para string primeiro
      }) as any[][];

      if (!data || data.length <= 1) {
        throw new BadRequestException(
          "A planilha não contém dados. Verifique se há pelo menos uma linha de cabeçalho e uma linha de dados.",
        );
      }

      this.logger.log(
        `📊 Planilha "${sheetName}" carregada: ${data.length - 1} linhas de dados`,
      );

      // FASE 1: VALIDAÇÃO E PREPARAÇÃO (sem salvar)
      const { registrosValidos, erros } = await this.validarEPreparar(
        data,
        currentUser,
      );

      // Se houver erros, retornar sem salvar nada
      if (erros.length > 0) {
        this.logger.warn(
          `❌ Validação falhou: ${erros.length} erros encontrados. Nenhum registro foi importado.`,
        );

        // Mostrar os primeiros 5 erros no log para debug
        const primeirosErros = erros.slice(0, 5);
        primeirosErros.forEach((erro) => {
          this.logger.warn(`   Linha ${erro.row}: ${erro.details.message}`);
        });

        if (erros.length > 5) {
          this.logger.warn(`   ... e mais ${erros.length - 5} erros`);
        }

        return {
          totalRows: data.length - 1,
          successCount: 0,
          errorCount: erros.length,
          errors: erros,
        };
      }

      // FASE 2: IMPORTAÇÃO COM TRANSAÇÃO (tudo ou nada)
      const result = await this.importarComTransacao(
        registrosValidos,
        currentUser,
      );

      this.logger.log(
        `✅ Importação concluída: ${result.successCount} registros salvos`,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ Erro na importação: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Erro ao processar arquivo: ${error.message}`,
      );
    }
  }

  private getXlsx(): typeof import("xlsx") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("xlsx") as typeof import("xlsx");
  }

  /**
   * FASE 1: Validar e preparar registros SEM SALVAR
   * Retorna lista de registros válidos e lista de erros
   */
  private async validarEPreparar(
    data: any[][],
    _currentUser: User,
  ): Promise<{
    registrosValidos: CreateDesarquivamentoDto[];
    erros: Array<{ row: number; details: any }>;
  }> {
    const registrosValidos: CreateDesarquivamentoDto[] = [];
    const erros: Array<{ row: number; details: any }> = [];
    const rows = data.slice(1); // Remove cabeçalho

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 (cabeçalho + índice base 0)

      try {
        // Extrair dados da linha
        // Planilha antiga: Status | Nome | NIC/Laudo | Processo | Tipo Doc | Data Sol | ...
        const statusRaw = this.getCell(row, 0); // Status (Finalizado, etc)
        const nomeRaw = this.getCell(row, 1); // Nome Completo
        const documentoRaw = this.getCell(row, 2); // NIC/Laudo/Auto
        const processoRaw = this.getCell(row, 3); // Nº Processo
        const tipoDocRaw = this.getCell(row, 4); // Tipo de Documento
        const dataSolicitacaoRaw = this.getCell(row, 5); // Data Solicitação
        const dataDesarquivamentoRaw = this.getCell(row, 6); // Data Desarquivamento SAG
        const dataDevolucaoRaw = this.getCell(row, 7); // Data Devolução
        const setorRaw = this.getCell(row, 8); // Setor Demandante
        const servidorRaw = this.getCell(row, 9); // Servidor Responsável
        const finalidadeRaw = this.getCell(row, 10); // Finalidade

        // Log detalhado para debug (apenas primeira e última linha para não poluir)
        if (i === 0 || i === rows.length - 1) {
          this.logger.debug(
            `🔍 Linha ${rowNumber} dados brutos: status="${statusRaw}", nome="${nomeRaw}", doc="${documentoRaw}", data="${dataSolicitacaoRaw}"`,
          );
        }

        // Validar campos obrigatórios VAZIOS
        const camposVazios: string[] = [];
        if (!nomeRaw || nomeRaw.trim() === "")
          camposVazios.push("Nome Completo (coluna B)");
        if (!documentoRaw || documentoRaw.trim() === "")
          camposVazios.push("Número NIC/Laudo/Auto (coluna C)");
        // numeroProcesso e setorDemandante agora são OPCIONAIS
        if (!tipoDocRaw || tipoDocRaw.trim() === "")
          camposVazios.push("Tipo de Documento (coluna E)");
        if (!dataSolicitacaoRaw || dataSolicitacaoRaw.toString().trim() === "")
          camposVazios.push("Data Solicitação (coluna F)");

        if (camposVazios.length > 0) {
          erros.push({
            row: rowNumber,
            details: {
              message: `Campos obrigatórios vazios: ${camposVazios.join(", ")}. Preencha estes campos na planilha e reimporte.`,
              data: row,
            },
          });
          continue;
        }

        // Processar numeroNicLaudoAuto
        const documentoLimpo = documentoRaw.trim();

        // Validar tamanho máximo do campo (500 caracteres)
        if (documentoLimpo.length > 500) {
          erros.push({
            row: rowNumber,
            details: {
              message: `Número NIC/Laudo/Auto excede 500 caracteres (tem ${documentoLimpo.length}). Reduza o tamanho na planilha: "${documentoLimpo.substring(0, 100)}..."`,
              data: row,
            },
          });
          continue;
        }

        // REMOVIDA a validação de duplicatas - agora permite mesmo BIC/NIC para nomes diferentes
        // Exemplo: João Silva - BIC Nº 146.040 e Maria Santos - BIC Nº 146.040 são permitidos

        // Tipo de desarquivamento: planilha antiga não tem essa coluna, usar FISICO como padrão
        const tipo = TipoDesarquivamentoEnum.FISICO;

        // Normalizar status
        const status = statusRaw
          ? this.normalizarStatus(statusRaw)
          : StatusDesarquivamentoEnum.SOLICITADO;

        // Converter datas (permitir vazio para campos opcionais)
        const dataSolicitacao = this.converterData(dataSolicitacaoRaw);
        if (!dataSolicitacao) {
          erros.push({
            row: rowNumber,
            details: {
              message: `Data de solicitação inválida: "${dataSolicitacaoRaw}". Use formatos: DD/MM/AAAA, AAAA-MM-DD, DD-MM-AAAA ou números do Excel.`,
              data: row,
            },
          });
          continue;
        }

        const dataDesarquivamento = dataDesarquivamentoRaw
          ? this.converterData(dataDesarquivamentoRaw)
          : undefined;
        const dataDevolucao = dataDevolucaoRaw
          ? this.converterData(dataDevolucaoRaw)
          : undefined;

        // Criar DTO como objeto plain
        const dtoPlain = {
          tipoDesarquivamento: tipo,
          desarquivamentoFisicoDigital: tipo as TipoDesarquivamentoEnum,
          status: status,
          nomeCompleto: nomeRaw.trim().substring(0, 255), // MaxLength 255
          numeroNicLaudoAuto: documentoLimpo.substring(0, 500), // MaxLength 500
          numeroProcesso: processoRaw
            ? processoRaw.trim().substring(0, 255)
            : null, // OPCIONAL
          tipoDocumento: tipoDocRaw.trim().substring(0, 100), // MaxLength 100
          dataSolicitacao: dataSolicitacao,
          dataDesarquivamentoSAG: dataDesarquivamento,
          dataDevolucaoSetor: dataDevolucao,
          setorDemandante: setorRaw ? setorRaw.trim().substring(0, 255) : null, // OPCIONAL
          servidorResponsavel: servidorRaw
            ? servidorRaw.trim().substring(0, 255)
            : "Não informado", // MaxLength 255
          finalidadeDesarquivamento: finalidadeRaw
            ? finalidadeRaw.trim().substring(0, 1000)
            : "Importação de dados históricos", // MaxLength 1000
          solicitacaoProrrogacao: false,
          urgente: false,
        };

        // Transformar em instância de DTO e validar
        const dto = plainToClass(CreateDesarquivamentoDto, dtoPlain);
        const validationErrors: ValidationError[] = await validate(dto);

        if (validationErrors.length > 0) {
          const errorMessages = validationErrors
            .map((error) => {
              const constraints = Object.values(error.constraints || {});
              return `Campo "${error.property}": ${constraints.join(", ")}`;
            })
            .join("; ");

          erros.push({
            row: rowNumber,
            details: {
              message: `Validação falhou: ${errorMessages}`,
              data: dtoPlain,
            },
          });
          continue;
        }

        registrosValidos.push(dto);
      } catch (error) {
        erros.push({
          row: rowNumber,
          details: {
            message: `Erro ao processar linha: ${error.message}`,
            data: row,
          },
        });
      }
    }

    return { registrosValidos, erros };
  }

  /**
   * FASE 2: Importar registros validados com TRANSAÇÃO
   * Se qualquer registro falhar, faz ROLLBACK de todos
   */
  private async importarComTransacao(
    registros: CreateDesarquivamentoDto[],
    currentUser: User,
  ): Promise<ImportResultDto> {
    const result = new ImportResultDto();
    result.totalRows = registros.length;
    result.successCount = 0;
    result.errorCount = 0;
    result.errors = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Processar SEQUENCIALMENTE para evitar conflito de numero_solicitacao
      for (let i = 0; i < registros.length; i++) {
        const dto = registros[i];

        try {
          await this.nugecidService.create(dto, currentUser, {
            manager: queryRunner.manager,
            skipAudit: true,
            skipNotifications: true,
          });
          result.successCount++;

          // Log a cada 10 registros
          if ((i + 1) % 10 === 0) {
            this.logger.log(`📦 Processados: ${i + 1}/${registros.length}`);
          }
        } catch (error) {
          this.logger.error(
            `Erro ao importar registro ${i + 1}: ${error.message}`,
          );
          throw error; // Lançar erro para fazer rollback
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `✅ Transação confirmada: ${result.successCount} registros salvos`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ ROLLBACK: Erro ao salvar registros`, error.stack);

      throw new BadRequestException(
        `Erro ao salvar registros no banco de dados: ${error.message}. ` +
          `Nenhum registro foi importado. Verifique os dados e tente novamente.`,
      );
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  /**
   * Obter valor de célula (trata undefined/null)
   */
  private getCell(row: any[], index: number): string {
    const value = row[index];
    if (value === undefined || value === null || value === "") return "";
    return String(value).trim();
  }

  /**
   * Normalizar tipo de desarquivamento conforme backend espera
   */
  private normalizarTipoDesarquivamento(value: string): string | null {
    if (!value) return TipoDesarquivamentoEnum.FISICO;

    const normalized = this.normalize(value);

    if (normalized.includes("DIGITAL")) return TipoDesarquivamentoEnum.DIGITAL;
    if (normalized.includes("NAO") && normalized.includes("LOCALIZADO"))
      return TipoDesarquivamentoEnum.NAO_LOCALIZADO;
    if (normalized.includes("FISICO")) return TipoDesarquivamentoEnum.FISICO;

    // Se não reconheceu, retornar null para erro
    return null;
  }

  /**
   * Normalizar status conforme backend espera
   */
  private normalizarStatus(value: string): StatusDesarquivamentoEnum {
    if (!value) return StatusDesarquivamentoEnum.SOLICITADO;

    const normalized = this.normalize(value);

    if (normalized.includes("FINALIZADO"))
      return StatusDesarquivamentoEnum.FINALIZADO;
    if (normalized.includes("DESARQUIVADO"))
      return StatusDesarquivamentoEnum.DESARQUIVADO;
    if (normalized.includes("NAO") && normalized.includes("COLETADO"))
      return StatusDesarquivamentoEnum.NAO_COLETADO;
    if (normalized.includes("REARQUIVAMENTO"))
      return StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO;
    if (normalized.includes("RETIRADO"))
      return StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR;
    if (normalized.includes("NAO") && normalized.includes("LOCALIZADO"))
      return StatusDesarquivamentoEnum.NAO_LOCALIZADO;

    return StatusDesarquivamentoEnum.SOLICITADO;
  }

  /**
   * Converter data para formato ISO (aceita múltiplos formatos)
   */
  private converterData(value: any): string | undefined {
    if (!value || value === "") return undefined;

    try {
      // 1. Se já é Date object
      if (value instanceof Date) {
        return value.toISOString();
      }

      // 2. Se é número (serial do Excel)
      if (!isNaN(Number(value))) {
        const numValue = Number(value);
        // Excel serial date (dias desde 1900-01-01)
        if (numValue > 1 && numValue < 100000) {
          const date = new Date((numValue - 25569) * 86400 * 1000);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }

      // 3. Se é string, tentar diversos formatos
      const strValue = String(value).trim();

      // Formato DD/MM/AAAA ou DD-MM-AAAA
      const ddmmyyyyMatch = strValue.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      );
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Formato AAAA-MM-DD
      const yyyymmddMatch = strValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (yyyymmddMatch) {
        const date = new Date(strValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Formato DD/MM/AA (ano com 2 dígitos)
      const ddmmyyMatch = strValue.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
      );
      if (ddmmyyMatch) {
        const [, day, month, year] = ddmmyyMatch;
        const fullYear =
          Number(year) < 50 ? 2000 + Number(year) : 1900 + Number(year);
        const date = new Date(fullYear, Number(month) - 1, Number(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Tentar parse direto
      const date = new Date(strValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
