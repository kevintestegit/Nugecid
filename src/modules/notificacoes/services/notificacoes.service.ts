import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Notificacao,
  TipoNotificacao,
  PrioridadeNotificacao,
} from '../entities';
import { User } from '../../users/entities/user.entity';
import { Tarefa } from '../../tarefas/entities/tarefa.entity';
import { DesarquivamentoTypeOrmEntity } from '../../nugecid/infrastructure/entities/desarquivamento.typeorm-entity';
import { StatusDesarquivamentoEnum } from '../../nugecid/domain/enums/status-desarquivamento.enum';

export interface CreateNotificacaoDto {
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  prioridade?: PrioridadeNotificacao;
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
}

export interface QueryNotificacoesDto {
  page?: number;
  limit?: number;
  lida?: boolean;
  tipo?: TipoNotificacao;
  prioridade?: PrioridadeNotificacao;
  dataInicio?: Date;
  dataFim?: Date;
}

@Injectable()
export class NotificacoesService {
  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
  ) {}

  async create(
    createNotificacaoDto: CreateNotificacaoDto,
  ): Promise<Notificacao> {
    // Verificar se o usuário existe
    const usuario = await this.userRepository.findOne({
      where: { id: createNotificacaoDto.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se a solicitação existe (se especificada)
    if (createNotificacaoDto.solicitacaoId) {
      const solicitacao = await this.tarefaRepository.findOne({
        where: { id: createNotificacaoDto.solicitacaoId },
      });

      if (!solicitacao) {
        throw new NotFoundException('Solicitação não encontrada');
      }
    }

    const notificacao = this.notificacaoRepository.create({
      ...createNotificacaoDto,
      prioridade:
        createNotificacaoDto.prioridade || PrioridadeNotificacao.MEDIA,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async findByUsuario(
    usuarioId: number,
    queryDto: QueryNotificacoesDto = {},
  ): Promise<{
    data: Notificacao[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verificar se o usuário existe
    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificacaoRepository
      .createQueryBuilder('notificacao')
      .leftJoinAndSelect('notificacao.usuario', 'usuario')
      .leftJoinAndSelect('notificacao.solicitacao', 'solicitacao')
      .where('notificacao.usuarioId = :usuarioId', { usuarioId })
      .andWhere('notificacao.deletedAt IS NULL');

    // Aplicar filtros
    if (queryDto.lida !== undefined) {
      queryBuilder.andWhere('notificacao.lida = :lida', {
        lida: queryDto.lida,
      });
    }

    if (queryDto.tipo) {
      queryBuilder.andWhere('notificacao.tipo = :tipo', {
        tipo: queryDto.tipo,
      });
    }

    if (queryDto.prioridade) {
      queryBuilder.andWhere('notificacao.prioridade = :prioridade', {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto.dataInicio && queryDto.dataFim) {
      queryBuilder.andWhere(
        'notificacao.createdAt BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio: queryDto.dataInicio,
          dataFim: queryDto.dataFim,
        },
      );
    }

    // Ordenação por prioridade e data
    queryBuilder
      .addSelect(
        "CASE notificacao.prioridade WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 WHEN 'baixa' THEN 4 ELSE 5 END",
        'prioridade_order',
      )
      .orderBy('prioridade_order', 'ASC')
      .addOrderBy('notificacao.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number, usuarioId: number): Promise<Notificacao> {
    const notificacao = await this.notificacaoRepository.findOne({
      where: { id, usuarioId },
      relations: ['usuario', 'solicitacao'],
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return notificacao;
  }

  async marcarComoLida(id: number, usuarioId: number): Promise<Notificacao> {
    const notificacao = await this.findOne(id, usuarioId);

    notificacao.marcarComoLida();
    return this.notificacaoRepository.save(notificacao);
  }

  async marcarComoNaoLida(id: number, usuarioId: number): Promise<Notificacao> {
    const notificacao = await this.findOne(id, usuarioId);

    notificacao.marcarComoNaoLida();
    return this.notificacaoRepository.save(notificacao);
  }

  async marcarTodasComoLidas(usuarioId: number): Promise<number> {
    const result = await this.notificacaoRepository.update(
      { usuarioId, lida: false },
      { lida: true },
    );

    return result.affected || 0;
  }

  async delete(id: number, usuarioId: number): Promise<void> {
    const notificacao = await this.findOne(id, usuarioId);

    await this.notificacaoRepository.softDelete(id);
  }

  async getEstatisticas(usuarioId: number): Promise<{
    total: number;
    naoLidas: number;
    lidas: number;
    porTipo: Record<string, number>;
    porPrioridade: Record<string, number>;
  }> {
    const notificacoes = await this.notificacaoRepository.find({
      where: { usuarioId },
    });

    const total = notificacoes.length;
    const naoLidas = notificacoes.filter(n => !n.lida).length;
    const lidas = notificacoes.filter(n => n.lida).length;

    const porTipo = notificacoes.reduce(
      (acc, n) => {
        acc[n.tipo] = (acc[n.tipo] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const porPrioridade = notificacoes.reduce(
      (acc, n) => {
        acc[n.prioridade] = (acc[n.prioridade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      naoLidas,
      lidas,
      porTipo,
      porPrioridade,
    };
  }

  // Métodos específicos para tipos de notificação
  async criarNotificacaoSolicitacaoPendente(
    usuarioId: number,
    solicitacaoId: number,
    diasPendentes: number,
  ): Promise<Notificacao> {
    const titulo = `Solicitação Pendente há ${diasPendentes} dias`;
    const descricao =
      'Uma solicitação está pendente há mais de 5 dias sem movimentação.';
    const detalhes = {
      dias_pendentes: diasPendentes,
      data_limite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
      acao_requerida: 'Verificar status da solicitação',
    };

    return this.create({
      tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
      titulo,
      descricao,
      detalhes,
      prioridade: PrioridadeNotificacao.ALTA,
      usuarioId,
      solicitacaoId,
    });
  }

  async criarNotificacaoNovoProcesso(
    usuarioId: number,
    processoId: number,
    numeroProcesso: string,
  ): Promise<Notificacao> {
    const titulo = 'Novo Processo de Desarquivamento';
    const descricao = `Um novo processo de desarquivamento foi extraído do SEIRN: ${numeroProcesso}`;
    const detalhes = {
      numero_processo: numeroProcesso,
      fonte: 'SEIRN',
      data_extracao: new Date(),
      acao_requerida: 'Analisar novo processo',
    };

    return this.create({
      tipo: TipoNotificacao.NOVO_PROCESSO,
      titulo,
      descricao,
      detalhes,
      prioridade: PrioridadeNotificacao.MEDIA,
      usuarioId,
      processoId,
    });
  }

  // Método para verificar solicitações pendentes (para ser executado periodicamente)
  async verificarSolicitacoesPendentes(): Promise<Notificacao[]> {
    const cincoDiasAtras = new Date();
    cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);

    const notificacoesCriadas: Notificacao[] = [];

    // Buscar desarquivamentos com status SOLICITADO há mais de 5 dias
    const desarquivamentosPendentes = await this.desarquivamentoRepository.find(
      {
        where: {
          status: StatusDesarquivamentoEnum.SOLICITADO,
          dataSolicitacao: LessThan(cincoDiasAtras),
        },
      },
    );

    for (const desarquivamento of desarquivamentosPendentes) {
      const notificacaoExistente = await this.notificacaoRepository.findOne({
        where: {
          tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
          processoId: desarquivamento.id,
          lida: false,
        },
      });

      if (notificacaoExistente) {
        continue;
      }

      const diasPendentes = Math.floor(
        (Date.now() - new Date(desarquivamento.dataSolicitacao).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const usuarioId =
        desarquivamento.responsavelId || desarquivamento.criadoPorId;

      if (!usuarioId) {
        continue;
      }

      const notificacao = await this.criarNotificacaoArquivoSolicitado(
        usuarioId,
        desarquivamento,
        diasPendentes,
      );

      notificacoesCriadas.push(notificacao);
    }

    // Buscar tarefas que não foram movimentadas há mais de 5 dias
    const solicitacoesPendentes = await this.tarefaRepository
      .createQueryBuilder('tarefa')
      .leftJoin('tarefa.coluna', 'coluna')
      .where('tarefa.updatedAt < :cincoDiasAtras', { cincoDiasAtras })
      .andWhere('coluna.nome ILIKE :colunaSolicitada', {
        colunaSolicitada: '%solicit%',
      })
      .getMany();

    for (const solicitacao of solicitacoesPendentes) {
      // Verificar se já existe notificação para esta solicitação
      const notificacaoExistente = await this.notificacaoRepository.findOne({
        where: {
          tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
          solicitacaoId: solicitacao.id,
          lida: false,
        },
      });

      if (!notificacaoExistente) {
        const diasPendentes = Math.floor(
          (Date.now() - solicitacao.updatedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Criar notificação para o responsável ou criador
        const usuarioId = solicitacao.responsavelId || solicitacao.criadorId;

        if (usuarioId) {
          const notificacao = await this.criarNotificacaoSolicitacaoPendente(
            usuarioId,
            solicitacao.id,
            diasPendentes,
          );
          notificacoesCriadas.push(notificacao);
        }
      }
    }

    return notificacoesCriadas;
  }

  private async criarNotificacaoArquivoSolicitado(
    usuarioId: number,
    desarquivamento: DesarquivamentoTypeOrmEntity,
    diasPendentes: number,
  ): Promise<Notificacao> {
    const titulo = `Desarquivamento aguardando há ${diasPendentes} dias`;
    const descricao =
      'Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.';
    const detalhes = {
      dias_pendentes: diasPendentes,
      numero_processo: desarquivamento.numeroProcesso,
      tipo_documento: desarquivamento.tipoDocumento,
      nome_completo: desarquivamento.nomeCompleto,
      data_solicitacao: desarquivamento.dataSolicitacao,
      acao_requerida: 'Verificar andamento do desarquivamento',
    };

    return this.create({
      tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
      titulo,
      descricao,
      detalhes,
      prioridade: PrioridadeNotificacao.ALTA,
      usuarioId,
      processoId: desarquivamento.id,
    });
  }
}
