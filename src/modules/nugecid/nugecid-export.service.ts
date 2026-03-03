import { Injectable, Logger } from "@nestjs/common";
import { NugecidService } from "./nugecid.service";
import { QueryDesarquivamentoDto } from "./dto/query-desarquivamento.dto";
import { User } from "../users/entities/user.entity";
import { writeSpreadsheetBuffer } from "../../common/utils/spreadsheet.util";

@Injectable()
export class NugecidExportService {
  private readonly logger = new Logger(NugecidExportService.name);

  constructor(private readonly nugecidService: NugecidService) {}

  async exportToExcel(
    queryDto: QueryDesarquivamentoDto,
    currentUser: User,
  ): Promise<Buffer> {
    const result = await this.nugecidService.findAll({
      ...queryDto,
      limit: 10000, // Export all matching records
      page: 1,
    });

    const worksheetData = result.desarquivamentos.map((item) => ({
      ID: item.id,
      "Código de Barras": item.numeroNicLaudoAuto,
      "Tipo Desarquivamento": item.tipoDesarquivamento,
      Status: item.status,
      "Nome Completo": item.nomeCompleto,
      "Número NIC/Laudo/Auto": item.numeroNicLaudoAuto,
      "Número Processo": item.numeroProcesso,
      "Tipo Documento": item.tipoDocumento || "",
      "Data Solicitação": item.dataSolicitacao
        ? new Date(item.dataSolicitacao).toISOString().split("T")[0]
        : "",
      "Data Desarquivamento SAG": item.dataDesarquivamentoSAG
        ? new Date(item.dataDesarquivamentoSAG).toISOString().split("T")[0]
        : "",
      "Data Devolução Setor": item.dataDevolucaoSetor
        ? new Date(item.dataDevolucaoSetor).toISOString().split("T")[0]
        : "",
      "Setor Demandante": item.setorDemandante,
      "Servidor Responsável": item.servidorResponsavel,
      "Finalidade Desarquivamento": item.finalidadeDesarquivamento,
      "Solicitação Prorrogação": item.solicitacaoProrrogacao ? "Sim" : "Não",
      Urgente: item.urgente ? "Sim" : "Não",
      "Criado Por ID": item.criadoPorId || "",
      "Responsável ID": item.responsavelId || "",
      "Criado em": new Date(item.createdAt).toISOString(),
      "Atualizado em": new Date(item.updatedAt).toISOString(),
    }));
    const buffer = await writeSpreadsheetBuffer({
      sheetName: "Desarquivamentos",
      rows: worksheetData,
    });

    this.logger.log(
      `Exportação realizada por ${currentUser.usuario}: ${result.total} registros`,
    );

    return buffer;
  }
}
