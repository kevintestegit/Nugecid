import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, In } from "typeorm";
import {
  Notificacao,
  TipoNotificacao,
  PrioridadeNotificacao,
} from "../entities";
import { User } from "../../users/entities/user.entity";
import { Tarefa } from "../../tarefas/entities/tarefa.entity";
import { DesarquivamentoTypeOrmEntity } from "../../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "../../nugecid/domain/enums/status-desarquivamento.enum";

export interface CreateNotificacaoDto {
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  prioridade?: PrioridadeNotificacao;
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
  tarefaId?: number;
  projetoId?: number;
  remetenteId?: number;
  link?: string;
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
      throw new NotFoundException("Usuário não encontrado");
    }

    // Verificar se a solicitação existe (se especificada)
    if (createNotificacaoDto.solicitacaoId) {
      const solicitacao = await this.tarefaRepository.findOne({
        where: { id: createNotificacaoDto.solicitacaoId },
      });

      if (!solicitacao) {
        throw new NotFoundException("Solicitação não encontrada");
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
      throw new NotFoundException("Usuário não encontrado");
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificacaoRepository
      .createQueryBuilder("notificacao")
      .leftJoinAndSelect("notificacao.usuario", "usuario")
      .leftJoinAndSelect("notificacao.solicitacao", "solicitacao")
      .where("notificacao.usuarioId = :usuarioId", { usuarioId })
      .andWhere("notificacao.deletedAt IS NULL");

    // Aplicar filtros
    if (queryDto.lida !== undefined) {
      queryBuilder.andWhere("notificacao.lida = :lida", {
        lida: queryDto.lida,
      });
    }

    if (queryDto.tipo) {
      queryBuilder.andWhere("notificacao.tipo = :tipo", {
        tipo: queryDto.tipo,
      });
    }

    if (queryDto.prioridade) {
      queryBuilder.andWhere("notificacao.prioridade = :prioridade", {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto.dataInicio && queryDto.dataFim) {
      queryBuilder.andWhere(
        "notificacao.createdAt BETWEEN :dataInicio AND :dataFim",
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
        "prioridade_order",
      )
      .orderBy("prioridade_order", "ASC")
      .addOrderBy("notificacao.createdAt", "DESC");

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
      relations: ["usuario", "solicitacao"],
    });

    if (!notificacao) {
      throw new NotFoundException("Notificação não encontrada");
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
    // Otimizado: usar queries SQL agregadas ao invés de carregar tudo em memória
    const [contagens, porTipoResult, porPrioridadeResult] = await Promise.all([
      // Contagem total, lidas e não lidas em uma única query
      this.notificacaoRepository
        .createQueryBuilder("n")
        .select("COUNT(*)", "total")
        .addSelect("SUM(CASE WHEN n.lida = true THEN 1 ELSE 0 END)", "lidas")
        .addSelect("SUM(CASE WHEN n.lida = false THEN 1 ELSE 0 END)", "naoLidas")
        .where("n.usuarioId = :usuarioId", { usuarioId })
        .andWhere("n.deletedAt IS NULL")
        .getRawOne(),

      // Contagem por tipo
      this.notificacaoRepository
        .createQueryBuilder("n")
        .select("n.tipo", "tipo")
        .addSelect("COUNT(*)", "count")
        .where("n.usuarioId = :usuarioId", { usuarioId })
        .andWhere("n.deletedAt IS NULL")
        .groupBy("n.tipo")
        .getRawMany(),

      // Contagem por prioridade
      this.notificacaoRepository
        .createQueryBuilder("n")
        .select("n.prioridade", "prioridade")
        .addSelect("COUNT(*)", "count")
        .where("n.usuarioId = :usuarioId", { usuarioId })
        .andWhere("n.deletedAt IS NULL")
        .groupBy("n.prioridade")
        .getRawMany(),
    ]);

    const porTipo = porTipoResult.reduce(
      (acc, row) => {
        acc[row.tipo] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    const porPrioridade = porPrioridadeResult.reduce(
      (acc, row) => {
        acc[row.prioridade] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: parseInt(contagens.total, 10) || 0,
      naoLidas: parseInt(contagens.naoLidas, 10) || 0,
      lidas: parseInt(contagens.lidas, 10) || 0,
      porTipo,
      porPrioridade,
    };
  }

  async findLatestByTipo(
    tipo: TipoNotificacao,
    usuarioId?: number,
  ): Promise<Notificacao | null> {
    const where: any = { tipo, deletedAt: null };
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }
    return this.notificacaoRepository.findOne({
      where,
      order: { createdAt: "DESC" },
    });
  }

  // Métodos específicos para tipos de notificação
  async criarNotificacaoSolicitacaoPendente(
    usuarioId: number,
    solicitacaoId: number,
    diasPendentes: number,
  ): Promise<Notificacao> {
    const titulo = `Solicitação Pendente há ${diasPendentes} dias`;
    const descricao =
      "Uma solicitação está pendente há mais de 5 dias sem movimentação.";
    const detalhes = {
      dias_pendentes: diasPendentes,
      data_limite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
      acao_requerida: "Verificar status da solicitação",
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
    const titulo = "Novo Processo de Desarquivamento";
    const descricao = `Um novo processo de desarquivamento foi extraído do SEIRN: ${numeroProcesso}`;
    const detalhes = {
      numero_processo: numeroProcesso,
      fonte: "SEIRN",
      data_extracao: new Date(),
      acao_requerida: "Analisar novo processo",
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

    // Buscar desarquivamentos e gestores em paralelo
    const [desarquivamentosPendentes, gestores] = await Promise.all([
      this.desarquivamentoRepository.find({
        where: {
          status: StatusDesarquivamentoEnum.SOLICITADO,
          dataSolicitacao: LessThan(cincoDiasAtras),
        },
      }),
      this.userRepository.find({
        where: [{ role: { name: "coordenador" } }, { role: { name: "admin" } }],
        relations: ["role"],
      }),
    ]);

    const gestoresIds = gestores.map((g) => g.id);

    // Coletar todos os IDs de desarquivamentos e usuários para buscar notificações existentes de uma vez
    const desarquivamentoIds = desarquivamentosPendentes.map((d) => d.id);

    // Buscar todas as notificações existentes de uma vez (evita N+1)
    const notificacoesExistentes = desarquivamentoIds.length > 0
      ? await this.notificacaoRepository
          .createQueryBuilder("n")
          .select(["n.processoId", "n.usuarioId"])
          .where("n.tipo = :tipo", { tipo: TipoNotificacao.SOLICITACAO_PENDENTE })
          .andWhere("n.processoId IN (:...ids)", { ids: desarquivamentoIds })
          .andWhere("n.lida = false")
          .getRawMany()
      : [];

    // Criar um Set para lookup rápido
    const notificacoesExistentesSet = new Set(
      notificacoesExistentes.map((n) => `${n.n_processoId}-${n.n_usuarioId}`),
    );

    // Processar desarquivamentos
    const notificacoesParaCriar: Array<{
      usuarioId: number;
      desarquivamento: DesarquivamentoTypeOrmEntity;
      diasPendentes: number;
    }> = [];

    // Buscar tarefas que não foram movimentadas há mais de 5 dias
    const solicitacoesPendentes = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoin("tarefa.coluna", "coluna")
      .where("tarefa.updatedAt < :cincoDiasAtras", { cincoDiasAtras })
      .andWhere("coluna.nome ILIKE :colunaSolicitada", {
        colunaSolicitada: "%solicit%",
      })
      .getMany();

    // Coletar todos os IDs de usuários que precisam ser validados
    const usuariosIdsParaValidar = new Set<number>(gestoresIds);
    for (const desarquivamento of desarquivamentosPendentes) {
      if (desarquivamento.criadoPorId) {
        usuariosIdsParaValidar.add(desarquivamento.criadoPorId);
      }
      if (desarquivamento.responsavelId) {
        usuariosIdsParaValidar.add(desarquivamento.responsavelId);
      }
    }

    // Adicionar IDs de usuários das tarefas
    for (const solicitacao of solicitacoesPendentes) {
      if (solicitacao.responsavelId) {
        usuariosIdsParaValidar.add(solicitacao.responsavelId);
      }
      if (solicitacao.criadorId) {
        usuariosIdsParaValidar.add(solicitacao.criadorId);
      }
    }

    // Buscar todos os usuários válidos de uma vez
    const usuariosValidos = usuariosIdsParaValidar.size > 0
      ? await this.userRepository.find({
          where: { id: In(Array.from(usuariosIdsParaValidar)) },
          select: ["id"],
        })
      : [];

    const usuariosValidosSet = new Set(usuariosValidos.map((u) => u.id));

    for (const desarquivamento of desarquivamentosPendentes) {
      const diasPendentes = Math.floor(
        (Date.now() - new Date(desarquivamento.dataSolicitacao).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const destinatarios = new Set<number>(gestoresIds);
      if (desarquivamento.criadoPorId && usuariosValidosSet.has(desarquivamento.criadoPorId)) {
        destinatarios.add(desarquivamento.criadoPorId);
      }
      if (desarquivamento.responsavelId && usuariosValidosSet.has(desarquivamento.responsavelId)) {
        destinatarios.add(desarquivamento.responsavelId);
      }

      for (const usuarioId of destinatarios) {
        if (!usuarioId || !usuariosValidosSet.has(usuarioId)) continue;

        const chave = `${desarquivamento.id}-${usuarioId}`;
        if (!notificacoesExistentesSet.has(chave)) {
          notificacoesParaCriar.push({ usuarioId, desarquivamento, diasPendentes });
        }
      }
    }

    // Criar notificações em lote
    for (const { usuarioId, desarquivamento, diasPendentes } of notificacoesParaCriar) {
      const notificacao = await this.criarNotificacaoArquivoSolicitado(
        usuarioId,
        desarquivamento,
        diasPendentes,
      );
      notificacoesCriadas.push(notificacao);
    }

    // Buscar notificações existentes para tarefas de uma vez
    const tarefaIds = solicitacoesPendentes.map((s) => s.id);
    const notificacoesTarefasExistentes = tarefaIds.length > 0
      ? await this.notificacaoRepository
          .createQueryBuilder("n")
          .select("n.solicitacaoId")
          .where("n.tipo = :tipo", { tipo: TipoNotificacao.SOLICITACAO_PENDENTE })
          .andWhere("n.solicitacaoId IN (:...ids)", { ids: tarefaIds })
          .andWhere("n.lida = false")
          .getRawMany()
      : [];

    const tarefasComNotificacao = new Set(
      notificacoesTarefasExistentes.map((n) => n.n_solicitacaoId),
    );

    for (const solicitacao of solicitacoesPendentes) {
      if (tarefasComNotificacao.has(solicitacao.id)) {
        continue;
      }

      const diasPendentes = Math.floor(
        (Date.now() - solicitacao.updatedAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const usuarioId = solicitacao.responsavelId || solicitacao.criadorId;

      // Verificar se o usuário existe antes de criar notificação
      if (usuarioId && usuariosValidosSet.has(usuarioId)) {
        const notificacao = await this.criarNotificacaoSolicitacaoPendente(
          usuarioId,
          solicitacao.id,
          diasPendentes,
        );
        notificacoesCriadas.push(notificacao);
      }
    }

    return notificacoesCriadas;
  }

  private async criarNotificacaoArquivoSolicitado(
    usuarioId: number,
    desarquivamento: DesarquivamentoTypeOrmEntity,
    diasPendentes: number,
  ): Promise<Notificacao> {
    const dataSolicitacaoFormatada = desarquivamento.dataSolicitacao
      ? new Intl.DateTimeFormat("pt-BR").format(
          new Date(desarquivamento.dataSolicitacao),
        )
      : "Data não informada";

    const titulo = `${
      desarquivamento.nomeCompleto || "Desarquivamento"
    } — aguardando há ${diasPendentes} dia${diasPendentes === 1 ? "" : "s"}`;

    const descricao =
      [
        desarquivamento.numeroProcesso
          ? `Processo ${desarquivamento.numeroProcesso}`
          : null,
        desarquivamento.tipoDocumento,
        `Solicitado em ${dataSolicitacaoFormatada}`,
      ]
        .filter(Boolean)
        .join(" • ") || "Desarquivamento permanece sem retorno.";

    const detalhes = {
      dias_pendentes: diasPendentes,
      numero_processo: desarquivamento.numeroProcesso,
      tipo_documento: desarquivamento.tipoDocumento,
      nome_completo: desarquivamento.nomeCompleto,
      data_solicitacao: desarquivamento.dataSolicitacao,
      acao_requerida: "Verificar andamento do desarquivamento",
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

  // ========== NOVOS MÉTODOS PARA TAREFAS ==========

  async notificarMencao(
    usuarioMencionadoId: number,
    remetenteId: number,
    tarefaId: number,
    comentario: string,
  ): Promise<Notificacao> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.MENCAO,
      titulo: `${remetente?.nome || "Alguém"} mencionou você`,
      descricao: `Você foi mencionado em um comentário na tarefa "${tarefa.titulo}"`,
      detalhes: {
        comentario: comentario.substring(0, 200),
        projeto: tarefa.projeto?.nome,
      },
      prioridade: PrioridadeNotificacao.MEDIA,
      usuarioId: usuarioMencionadoId,
      tarefaId,
      remetenteId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async notificarTarefaAtribuida(
    usuarioAtribuidoId: number,
    remetenteId: number,
    tarefaId: number,
  ): Promise<Notificacao> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_ATRIBUIDA,
      titulo: "Nova tarefa atribuída",
      descricao: `${remetente?.nome || "Alguém"} atribuiu você à tarefa "${tarefa.titulo}"`,
      detalhes: {
        prioridade: tarefa.prioridade,
        prazo: tarefa.prazo,
        projeto: tarefa.projeto?.nome,
      },
      prioridade: this.mapPrioridadeTarefaParaNotificacao(tarefa.prioridade),
      usuarioId: usuarioAtribuidoId,
      tarefaId,
      remetenteId,
      projetoId: tarefa.projetoId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async notificarTarefaAlterada(
    usuarioId: number,
    remetenteId: number,
    tarefaId: number,
    mudancas: string[],
  ): Promise<Notificacao> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_ALTERADA,
      titulo: "Tarefa atualizada",
      descricao: `${remetente?.nome || "Alguém"} atualizou a tarefa "${tarefa.titulo}"`,
      detalhes: {
        mudancas,
      },
      prioridade: PrioridadeNotificacao.BAIXA,
      usuarioId,
      tarefaId,
      remetenteId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async notificarComentario(
    usuarioId: number,
    remetenteId: number,
    tarefaId: number,
    comentario: string,
  ): Promise<Notificacao> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const remetente = await this.userRepository.findOne({
      where: { id: remetenteId },
    });

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_COMENTADA,
      titulo: "Novo comentário",
      descricao: `${remetente?.nome || "Alguém"} comentou na tarefa "${tarefa.titulo}"`,
      detalhes: {
        comentario: comentario.substring(0, 200),
      },
      prioridade: PrioridadeNotificacao.BAIXA,
      usuarioId,
      tarefaId,
      remetenteId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async notificarPrazoProximo(
    usuarioId: number,
    tarefaId: number,
    diasRestantes: number,
  ): Promise<Notificacao> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.PRAZO_PROXIMO,
      titulo: `Prazo se aproximando`,
      descricao: `A tarefa "${tarefa.titulo}" vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}`,
      detalhes: {
        prazo: tarefa.prazo,
        diasRestantes,
        prioridade: tarefa.prioridade,
      },
      prioridade:
        diasRestantes <= 1
          ? PrioridadeNotificacao.ALTA
          : PrioridadeNotificacao.MEDIA,
      usuarioId,
      tarefaId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async notificarTarefaAtrasada(
    usuarioId: number,
    tarefaId: number,
    diasAtrasados: number,
  ): Promise<Notificacao> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    const notificacao = this.notificacaoRepository.create({
      tipo: TipoNotificacao.TAREFA_ATRASADA,
      titulo: "Tarefa atrasada",
      descricao: `A tarefa "${tarefa.titulo}" está atrasada há ${diasAtrasados} ${diasAtrasados === 1 ? "dia" : "dias"}`,
      detalhes: {
        prazo: tarefa.prazo,
        diasAtrasados,
        prioridade: tarefa.prioridade,
      },
      prioridade: PrioridadeNotificacao.CRITICA,
      usuarioId,
      tarefaId,
      link: `/tarefas/${tarefaId}`,
    });

    return this.notificacaoRepository.save(notificacao);
  }

  async verificarTarefasComPrazoProximo(): Promise<Notificacao[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const doisDiasDepois = new Date(hoje);
    doisDiasDepois.setDate(doisDiasDepois.getDate() + 2);

    const tarefas = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .select(["tarefa.id", "tarefa.prazo", "tarefa.responsavelId"])
      .where("tarefa.prazo >= :hoje", { hoje })
      .andWhere("tarefa.prazo <= :doisDias", { doisDias: doisDiasDepois })
      .andWhere("tarefa.deletedAt IS NULL")
      .andWhere("tarefa.responsavelId IS NOT NULL")
      .getMany();

    if (tarefas.length === 0) {
      return [];
    }

    // Buscar notificações existentes de uma vez
    const tarefaIds = tarefas.map((t) => t.id);
    const notificacoesExistentes = await this.notificacaoRepository
      .createQueryBuilder("n")
      .select("n.tarefaId")
      .where("n.tipo = :tipo", { tipo: TipoNotificacao.PRAZO_PROXIMO })
      .andWhere("n.tarefaId IN (:...ids)", { ids: tarefaIds })
      .andWhere("n.lida = false")
      .getRawMany();

    const tarefasComNotificacao = new Set(
      notificacoesExistentes.map((n) => n.n_tarefaId),
    );

    const notificacoes: Notificacao[] = [];

    for (const tarefa of tarefas) {
      if (tarefasComNotificacao.has(tarefa.id)) continue;

      const diasRestantes = Math.ceil(
        (new Date(tarefa.prazo).getTime() - hoje.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const notificacao = await this.notificarPrazoProximo(
        tarefa.responsavelId,
        tarefa.id,
        diasRestantes,
      );

      notificacoes.push(notificacao);
    }

    return notificacoes;
  }

  async verificarTarefasAtrasadas(): Promise<Notificacao[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const tarefas = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .select(["tarefa.id", "tarefa.prazo", "tarefa.responsavelId"])
      .where("tarefa.prazo < :hoje", { hoje })
      .andWhere("tarefa.deletedAt IS NULL")
      .andWhere("tarefa.responsavelId IS NOT NULL")
      .getMany();

    if (tarefas.length === 0) {
      return [];
    }

    // Buscar notificações existentes de uma vez (últimas 24h)
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const tarefaIds = tarefas.map((t) => t.id);
    const notificacoesExistentes = await this.notificacaoRepository
      .createQueryBuilder("n")
      .select("n.tarefaId")
      .where("n.tipo = :tipo", { tipo: TipoNotificacao.TAREFA_ATRASADA })
      .andWhere("n.tarefaId IN (:...ids)", { ids: tarefaIds })
      .andWhere("n.createdAt > :umDiaAtras", { umDiaAtras })
      .getRawMany();

    const tarefasComNotificacao = new Set(
      notificacoesExistentes.map((n) => n.n_tarefaId),
    );

    const notificacoes: Notificacao[] = [];

    for (const tarefa of tarefas) {
      if (tarefasComNotificacao.has(tarefa.id)) continue;

      const diasAtrasados = Math.floor(
        (hoje.getTime() - new Date(tarefa.prazo).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const notificacao = await this.notificarTarefaAtrasada(
        tarefa.responsavelId,
        tarefa.id,
        diasAtrasados,
      );

      notificacoes.push(notificacao);
    }

    return notificacoes;
  }

  private async getAdministradoresIds(
    excludeIds: number[] = [],
  ): Promise<number[]> {
    const qb = this.userRepository
      .createQueryBuilder("usuario")
      .leftJoin("usuario.role", "role")
      .where("usuario.deletedAt IS NULL")
      .andWhere("LOWER(role.name) = :role", { role: "admin" });

    if (excludeIds.length > 0) {
      qb.andWhere("usuario.id NOT IN (:...excludeIds)", { excludeIds });
    }

    const administradores = await qb.getMany();
    return administradores.map((admin) => admin.id);
  }

  async notificarNovoRegistro(
    autorId: number | null,
    registroId?: string,
    resumo?: {
      numeroProcesso?: string;
      delegacia?: string;
      totalImportado?: number;
    },
  ): Promise<void> {
    const destinatarios = await this.getAdministradoresIds(
      autorId ? [autorId] : [],
    );

    if (!destinatarios.length) {
      return;
    }

    const autor = autorId
      ? await this.userRepository.findOne({ where: { id: autorId } })
      : null;

    const descricaoBase = autor
      ? `${autor.nome} adicionou um novo registro ao sistema.`
      : "Um novo registro foi adicionado ao sistema.";

    await Promise.all(
      destinatarios.map((usuarioId) =>
        this.create({
          tipo: TipoNotificacao.NOVO_REGISTRO,
          titulo: "Novo registro cadastrado",
          descricao: descricaoBase,
          detalhes: {
            registroId,
            ...resumo,
          },
          prioridade: PrioridadeNotificacao.MEDIA,
          usuarioId,
          link: "/registros",
        }),
      ),
    );
  }

  async notificarPastaCriada(
    autorId: number | null,
    pastaId: string,
    nomePasta: string,
  ): Promise<void> {
    const destinatarios = await this.getAdministradoresIds(
      autorId ? [autorId] : [],
    );

    if (!destinatarios.length) {
      return;
    }

    const autor = autorId
      ? await this.userRepository.findOne({
          where: { id: autorId },
        })
      : null;

    const descricao = autor
      ? `${autor.nome} criou a prateleira "${nomePasta}".`
      : `Uma nova prateleira "${nomePasta}" foi criada.`;

    await Promise.all(
      destinatarios.map((usuarioId) =>
        this.create({
          tipo: TipoNotificacao.PASTA_CRIADA,
          titulo: "Nova prateleira cadastrada",
          descricao,
          detalhes: {
            pastaId,
            nome: nomePasta,
          },
          prioridade: PrioridadeNotificacao.MEDIA,
          usuarioId,
          link: `/arquivo/${pastaId}`,
        }),
      ),
    );
  }

  async notificarEventoAuditoria(
    autorId: number,
    entidade: string,
    acao: string,
    entityId?: number | string,
    detalhesExtras?: Record<string, any>,
  ): Promise<void> {
    const destinatarios = await this.getAdministradoresIds([autorId]);

    if (!destinatarios.length) {
      return;
    }

    const autor = await this.userRepository.findOne({
      where: { id: autorId },
    });

    const acaoNormalizada = acao.toLowerCase();
    const descricao = autor
      ? `${autor.nome} realizou a ação ${acaoNormalizada} em ${entidade}.`
      : `Uma ação ${acaoNormalizada} foi registrada em ${entidade}.`;

    const detalhes = {
      entidade,
      acao,
      entityId,
      ...detalhesExtras,
    };

    await Promise.all(
      destinatarios.map((usuarioId) =>
        this.create({
          tipo: TipoNotificacao.EVENTO_AUDITORIA,
          titulo: `Alteração em ${entidade}`,
          descricao,
          detalhes,
          prioridade: PrioridadeNotificacao.MEDIA,
          usuarioId,
          link: "/auditoria",
        }),
      ),
    );
  }

  private mapPrioridadeTarefaParaNotificacao(
    prioridade: string,
  ): PrioridadeNotificacao {
    switch (prioridade?.toLowerCase()) {
      case "critica":
        return PrioridadeNotificacao.CRITICA;
      case "alta":
        return PrioridadeNotificacao.ALTA;
      case "media":
        return PrioridadeNotificacao.MEDIA;
      case "baixa":
        return PrioridadeNotificacao.BAIXA;
      default:
        return PrioridadeNotificacao.MEDIA;
    }
  }
}
