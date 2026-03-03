import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { readSpreadsheetObjects } from "../../common/utils/spreadsheet.util";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { CreateDesarquivamentoUseCase } from "../nugecid/application/use-cases/create-desarquivamento/create-desarquivamento.use-case";
import { SeiCaptura } from "./entities/sei-captura.entity";
import { QuerySeiCapturasDto } from "./dto/query-sei-capturas.dto";
import { SeiCapturaMapperService } from "./sei-captura-mapper.service";
import { SeiCapturaStatus } from "./sei-captura.types";

export interface SeiImportacaoResumo {
  total: number;
  criadas: number;
  incompletas: number;
  duplicidades: number;
  prontas: number;
}

@Injectable()
export class SeiCapturaService {
  constructor(
    @InjectRepository(SeiCaptura)
    private readonly capturaRepository: Repository<SeiCaptura>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    private readonly mapper: SeiCapturaMapperService,
    private readonly createDesarquivamentoUseCase: CreateDesarquivamentoUseCase,
  ) {}

  async importarPlanilha(
    file: Express.Multer.File | undefined,
    userId: number | null,
  ): Promise<{ resumo: SeiImportacaoResumo; capturas: SeiCaptura[] }> {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo do SEI foi enviado.");
    }

    const { rows } = await readSpreadsheetObjects(
      file.buffer,
      file.originalname,
    );

    if (!rows.length) {
      throw new BadRequestException(
        "Arquivo do SEI nao possui linhas validas.",
      );
    }

    const capturas: SeiCaptura[] = [];

    for (const [index, row] of rows.entries()) {
      const registro = this.mapper.mapRow(row);
      const validacao = this.mapper.validate(registro);
      const duplicidade = await this.detectarDuplicidade(
        registro.numeroProcessoSei,
        registro.numeroPci,
      );
      const status = duplicidade.duplicidadeForte
        ? SeiCapturaStatus.POSSIVEL_DUPLICIDADE
        : validacao.status;

      capturas.push(
        this.capturaRepository.create({
          ...registro,
          status,
          motivoStatus: duplicidade.duplicidadeForte
            ? duplicidade.motivo
            : validacao.motivo,
          camposAusentes: validacao.camposAusentes,
          duplicidadeForte: duplicidade.duplicidadeForte,
          duplicidadeProvavel: duplicidade.duplicidadeProvavel,
          arquivoOrigem: file.originalname,
          linhaOrigem: index + 2,
          dadosOriginais: row,
          criadoPorId: userId,
          aprovadoPorId: null,
          desarquivamentoId: null,
          importadoEm: null,
        }),
      );
    }

    const salvas = await this.capturaRepository.save(capturas);

    return {
      resumo: this.calcularResumo(salvas),
      capturas: salvas,
    };
  }

  async listar(query: QuerySeiCapturasDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: FindOptionsWhere<SeiCaptura> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.numeroProcessoSei) {
      where.numeroProcessoSei = ILike(`%${query.numeroProcessoSei}%`);
    }

    const [data, total] = await this.capturaRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async aprovar(id: string, userId: number) {
    const captura = await this.capturaRepository.findOne({ where: { id } });

    if (!captura) {
      throw new NotFoundException("Captura do SEI nao encontrada.");
    }

    if (captura.status === SeiCapturaStatus.IMPORTADO) {
      throw new BadRequestException("Captura do SEI ja foi importada.");
    }

    if (captura.status !== SeiCapturaStatus.PRONTO_PARA_IMPORTAR) {
      throw new BadRequestException(
        "Apenas capturas prontas para importar podem ser aprovadas.",
      );
    }

    const duplicidade = await this.detectarDuplicidade(
      captura.numeroProcessoSei,
      captura.numeroPci,
    );

    if (duplicidade.duplicidadeForte) {
      captura.status = SeiCapturaStatus.POSSIVEL_DUPLICIDADE;
      captura.duplicidadeForte = true;
      captura.motivoStatus = duplicidade.motivo;
      await this.capturaRepository.save(captura);
      throw new BadRequestException(duplicidade.motivo);
    }

    const desarquivamento = await this.createDesarquivamentoUseCase.execute({
      tipoDesarquivamento: "FISICO",
      nomeCompleto: captura.interessado ?? "Interessado nao informado",
      numeroNicLaudoAuto: captura.numeroPci,
      numeroProcesso: captura.numeroProcessoSei ?? undefined,
      tipoDocumento: captura.tipoProcesso ?? "Processo SEI",
      dataSolicitacao:
        captura.dataEntradaSei?.toISOString() ?? new Date().toISOString(),
      setorDemandante: captura.unidadeOrigem ?? captura.unidadeAtual ?? "SEI",
      servidorResponsavel: "Integracao SEI",
      finalidadeDesarquivamento:
        captura.assunto ?? captura.textoResumo ?? "Registro importado do SEI.",
      solicitacaoProrrogacao: false,
      dadosAdicionais: this.buildDadosAdicionais(captura),
      urgente: false,
      instituto: captura.unidadeAtual ?? captura.unidadeOrigem ?? undefined,
      requerente: captura.interessado ?? undefined,
      criadoPorId: userId,
    });

    captura.status = SeiCapturaStatus.IMPORTADO;
    captura.aprovadoPorId = userId;
    captura.desarquivamentoId = desarquivamento.id;
    captura.importadoEm = new Date();
    captura.motivoStatus = "Importado para desarquivamento.";

    await this.capturaRepository.save(captura);

    return { captura, desarquivamento };
  }

  private async detectarDuplicidade(
    numeroProcessoSei: string | null,
    numeroPci: string | null,
  ): Promise<{
    duplicidadeForte: boolean;
    duplicidadeProvavel: boolean;
    motivo: string | null;
  }> {
    if (numeroProcessoSei) {
      const existente = await this.desarquivamentoRepository.findOne({
        where: { numeroProcesso: numeroProcessoSei },
        withDeleted: false,
      });

      if (existente) {
        return {
          duplicidadeForte: true,
          duplicidadeProvavel: false,
          motivo: `Ja existe desarquivamento para o processo SEI ${numeroProcessoSei}.`,
        };
      }
    }

    if (numeroPci) {
      const existente = await this.desarquivamentoRepository.findOne({
        where: { numeroNicLaudoAuto: numeroPci },
        withDeleted: false,
      });

      if (existente) {
        return {
          duplicidadeForte: true,
          duplicidadeProvavel: false,
          motivo: `Ja existe desarquivamento para o PCI ${numeroPci}.`,
        };
      }
    }

    return {
      duplicidadeForte: false,
      duplicidadeProvavel: false,
      motivo: null,
    };
  }

  private calcularResumo(capturas: SeiCaptura[]): SeiImportacaoResumo {
    return capturas.reduce<SeiImportacaoResumo>(
      (resumo, captura) => {
        resumo.total += 1;
        resumo.criadas += 1;

        if (captura.status === SeiCapturaStatus.INCOMPLETO) {
          resumo.incompletas += 1;
        }

        if (captura.status === SeiCapturaStatus.POSSIVEL_DUPLICIDADE) {
          resumo.duplicidades += 1;
        }

        if (captura.status === SeiCapturaStatus.PRONTO_PARA_IMPORTAR) {
          resumo.prontas += 1;
        }

        return resumo;
      },
      { total: 0, criadas: 0, incompletas: 0, duplicidades: 0, prontas: 0 },
    );
  }

  private buildDadosAdicionais(captura: SeiCaptura): string {
    return [
      "Origem: SEI",
      captura.numeroProcessoSei
        ? `Processo SEI: ${captura.numeroProcessoSei}`
        : null,
      captura.numeroPci ? `PCI: ${captura.numeroPci}` : null,
      captura.linkSei ? `Link SEI: ${captura.linkSei}` : null,
      captura.textoResumo ? `Resumo: ${captura.textoResumo}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }
}
