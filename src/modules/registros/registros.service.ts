// src/modules/registros/registros.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { validate } from "class-validator";
import * as XLSX from "xlsx";

import { Registro } from "./entities/registro.entity";
import { ImportRegistroDto } from "./dto/import-registro.dto";
import { NotificacoesService } from "../notificacoes/services";

@Injectable()
export class RegistrosService {
  private readonly logger = new Logger(RegistrosService.name);

  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  async importFromXlsx(file: Express.Multer.File, userId?: number) {
    const workbook = XLSX.read(file.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const totalRows = data.length;
    let successCount = 0;
    const errors = [];
    const novosRegistros: Registro[] = [];

    for (let i = 0; i < totalRows; i++) {
      const row = data[i];
      const registroDto = new ImportRegistroDto();

      // Mapeamento cuidadoso dos campos, especialmente a data
      registroDto.numero_processo = row["numero_processo"];
      registroDto.delegacia_origem = row["delegacia_origem"];
      registroDto.nome_vitima = row["nome_vitima"];
      registroDto.data_fato = new Date(row["data_fato"]);
      registroDto.investigador_responsavel = row["investigador_responsavel"];
      registroDto.idade_vitima = row["idade_vitima"];

      const validationErrors = await validate(registroDto);

      if (validationErrors.length > 0) {
        errors.push({
          row: i + 2, // +2 para corresponder à linha da planilha (cabeçalho + 1-based index)
          data: row,
          errors: validationErrors.map((err) => ({
            property: err.property,
            constraints: err.constraints,
          })),
        });
      } else {
        try {
          const newRegistro = this.registroRepository.create(registroDto);
          const savedRegistro = await this.registroRepository.save(newRegistro);
          novosRegistros.push(savedRegistro);
          successCount++;
        } catch (dbError) {
          this.logger.error(
            `Erro ao salvar no banco de dados na linha ${i + 2}:`,
            dbError,
          );
          errors.push({
            row: i + 2,
            data: row,
            errors: [
              {
                property: "database",
                constraints: {
                  save: "Falha ao inserir o registro no banco de dados.",
                },
              },
            ],
          });
        }
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `${errors.length} linhas continham erros e não foram importadas.`,
      );
    }

    if (novosRegistros.length > 0) {
      await this.notificacoesService.notificarNovoRegistro(
        userId ?? null,
        novosRegistros[0]?.id,
        {
          totalImportado: novosRegistros.length,
          numeroProcesso: novosRegistros[0]?.numero_processo,
          delegacia: novosRegistros[0]?.delegacia_origem,
        },
      );
    }
    return {
      totalRows,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }
}
