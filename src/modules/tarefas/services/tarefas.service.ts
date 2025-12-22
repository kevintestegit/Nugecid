import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryFailedError, DataSource, In } from "typeorm";
import { NotificacoesService } from "../../notificacoes/services";
import {
  Tarefa,
  Projeto,
  Coluna,
  HistoricoTarefa,
  Comentario,
  Checklist,
} from "../entities";
import {
  CreateTarefaDto,
  UpdateTarefaDto,
  MoveTarefaDto,
  QueryTarefaDto,
  FiltrosTarefasDto,
} from "../dto";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class TarefasService {
  private readonly logger = new Logger(TarefasService.name);

  constructor(
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(Coluna)
    private readonly colunaRepository: Repository<Coluna>,
    @InjectRepository(HistoricoTarefa)
    private readonly historicoRepository: Repository<HistoricoTarefa>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    private readonly notificacoesService: NotificacoesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createTarefaDto: CreateTarefaDto,
    criadorId: number,
  ): Promise<Tarefa> {
    // Verificar se o projeto existe e se o usuário tem acesso
    const projeto = await this.projetoRepository.findOne({
      where: { id: createTarefaDto.projetoId },
      relations: ["membros"],
    });

    if (!projeto) {
      throw new NotFoundException("Projeto não encontrado");
    }

    if (!projeto.canUserEdit(criadorId)) {
      throw new ForbiddenException(
        "Você não tem permissão para criar tarefas neste projeto",
      );
    }

    // Verificar se a coluna existe e pertence ao projeto (obrigatório apenas se não for subtarefa)
    if (createTarefaDto.colunaId) {
      const coluna = await this.colunaRepository.findOne({
        where: {
          id: createTarefaDto.colunaId,
          projetoId: createTarefaDto.projetoId,
        },
      });

      if (!coluna) {
        throw new NotFoundException(
          "Coluna não encontrada ou não pertence ao projeto",
        );
      }
    } else if (!createTarefaDto.parentId) {
      // Se não tem coluna e não é subtarefa, é inválido
      throw new BadRequestException(
        "Tarefa deve ter uma coluna ou ser uma subtarefa",
      );
    }

    const responsavelIds = this.normalizeResponsavelIds(createTarefaDto);
    const responsaveis = await this.resolveResponsaveis(responsavelIds, projeto);

    // Executar criação dentro de transação
    const savedTarefa = await this.dataSource.transaction(async (manager) => {
      // Se não foi especificada uma ordem, colocar no final da coluna
      if (!createTarefaDto.ordem) {
        const lastTarefa = await manager.findOne(Tarefa, {
          where: { colunaId: createTarefaDto.colunaId },
          order: { ordem: "DESC" },
        });
        createTarefaDto.ordem = lastTarefa ? lastTarefa.ordem + 1 : 1;
      } else {
        // Reordenar tarefas existentes se necessário
        await this.reorderTasksWithManager(
          manager,
          createTarefaDto.colunaId,
          createTarefaDto.ordem,
          "insert",
        );
      }

      const { responsavelId, responsavelIds: _, ...payload } = createTarefaDto;
      const tarefa = manager.create(Tarefa, {
        ...payload,
        criadorId,
        responsavelId: responsaveis[0]?.id ?? null,
        responsaveis,
      });

      const saved = await manager.save(tarefa);

      // Criar histórico
      await this.createHistoryEntryWithManager(
        manager,
        saved.id,
        criadorId,
        "criacao",
        "titulo",
        null,
        saved.titulo,
      );

      return saved;
    });

    // Notificação fora da transação (pode falhar sem comprometer os dados)
    await this.notificarAtribuicoesTarefa(
      responsaveis.map((usuario) => usuario.id),
      criadorId,
      savedTarefa.id,
    );

    return this.findOne(savedTarefa.id, criadorId);
  }

  async findAll(projetoId: number, userId: number): Promise<Tarefa[]> {
    // Verificar se o projeto existe e se o usuÃ¡rio tem acesso
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ["membros"],
    });

    if (!projeto) {
      throw new NotFoundException("Projeto nÃ£o encontrado");
    }

    if (!projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "VocÃª nÃ£o tem permissÃ£o para acessar este projeto",
      );
    }

    return this.tarefaRepository.find({
      where: { projetoId },
      relations: ["coluna", "responsavel", "responsaveis", "criador"],
      order: { colunaId: "ASC", ordem: "ASC" },
    });
  }

  async findWithFilters(
    queryDto: QueryTarefaDto,
    userId: number,
  ): Promise<{
    data: Tarefa[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    // Verificar se o projeto existe e se o usuÃ¡rio tem acesso
    if (queryDto.projeto_id) {
      const projeto = await this.projetoRepository.findOne({
        where: { id: queryDto.projeto_id },
        relations: ["membros"],
      });

      if (!projeto) {
        throw new NotFoundException("Projeto nÃ£o encontrado");
      }

      if (!projeto.canUserView(userId)) {
        throw new ForbiddenException(
          "VocÃª nÃ£o tem permissÃ£o para acessar este projeto",
        );
      }
    }

    // Verificar se o repositÃ³rio estÃ¡ inicializado corretamente
    if (!this.tarefaRepository || !this.tarefaRepository.metadata) {
      throw new Error(
        "RepositÃ³rio de tarefas nÃ£o estÃ¡ inicializado corretamente",
      );
    }

    const queryBuilder = this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoinAndSelect("tarefa.coluna", "coluna")
      .leftJoinAndSelect("tarefa.responsavel", "responsavel")
      .leftJoinAndSelect("tarefa.responsaveis", "responsaveis")
      .leftJoinAndSelect("tarefa.criador", "criador")
      .leftJoinAndSelect("tarefa.projeto", "projeto")
      .distinct(true);

    // Aplicar filtros
    if (queryDto.projeto_id) {
      queryBuilder.andWhere("tarefa.projetoId = :projetoId", {
        projetoId: queryDto.projeto_id,
      });
    }

    if (queryDto.colunaId) {
      queryBuilder.andWhere("tarefa.colunaId = :colunaId", {
        colunaId: queryDto.colunaId,
      });
    }

    if (queryDto.responsavelId) {
      queryBuilder.andWhere(
        "(tarefa.responsavelId = :responsavelId OR responsaveis.id = :responsavelId)",
        { responsavelId: queryDto.responsavelId },
      );
    }

    if (queryDto.prioridade) {
      queryBuilder.andWhere("tarefa.prioridade = :prioridade", {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        "(tarefa.titulo ILIKE :search OR tarefa.descricao ILIKE :search)",
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto.tags && queryDto.tags.length > 0) {
      queryBuilder.andWhere("tarefa.tags && :tags", { tags: queryDto.tags });
    }

    if (queryDto.dataInicio) {
      queryBuilder.andWhere("tarefa.prazo >= :dataInicio", {
        dataInicio: queryDto.dataInicio,
      });
    }

    if (queryDto.dataFim) {
      queryBuilder.andWhere("tarefa.prazo <= :dataFim", {
        dataFim: queryDto.dataFim,
      });
    }

    if (queryDto.atrasadas) {
      const hoje = new Date();
      queryBuilder.andWhere("tarefa.prazo < :hoje", { hoje });
      queryBuilder.andWhere("coluna.nome != :concluido", {
        concluido: "ConcluÃ­do",
      });
    }

    // Aplicar ordenaÃ§Ã£o
    const sortBy = queryDto.sortBy || "createdAt";
    const sortOrder = queryDto.sortOrder || "DESC";

    // LÃ³gica de ordenaÃ§Ã£o
    switch (sortBy) {
      case "id":
        queryBuilder.orderBy("tarefa.id", sortOrder as "ASC" | "DESC");
        break;
      case "titulo":
        queryBuilder.orderBy("tarefa.titulo", sortOrder as "ASC" | "DESC");
        break;
      case "descricao":
        queryBuilder.orderBy("tarefa.descricao", sortOrder as "ASC" | "DESC");
        break;
      case "prazo":
        queryBuilder.orderBy("tarefa.prazo", sortOrder as "ASC" | "DESC");
        break;
      case "prioridade":
        queryBuilder.orderBy("tarefa.prioridade", sortOrder as "ASC" | "DESC");
        break;
      case "updatedAt":
        queryBuilder.orderBy("tarefa.updatedAt", sortOrder as "ASC" | "DESC");
        break;
      case "ordem":
        queryBuilder
          .orderBy("tarefa.colunaId", "ASC")
          .addOrderBy("tarefa.ordem", sortOrder as "ASC" | "DESC");
        break;
      case "coluna":
        queryBuilder.orderBy("coluna.nome", sortOrder as "ASC" | "DESC");
        break;
      case "projeto":
        queryBuilder.orderBy("projeto.nome", sortOrder as "ASC" | "DESC");
        break;
      case "responsavel":
        queryBuilder.orderBy("responsavel.nome", sortOrder as "ASC" | "DESC");
        break;
      case "createdAt":
      default:
        queryBuilder.orderBy("tarefa.createdAt", sortOrder as "ASC" | "DESC");
        break;
    }

    // Contar total
    let total = 0;
    let tarefas: Tarefa[] = [];

    // Aplicar paginaÃ§Ã£o
    const page = queryDto.page || 1;
    const limit = queryDto.limit && queryDto.limit > 0 ? queryDto.limit : 10;
    const skip = (page - 1) * limit;

    try {
      total = await queryBuilder.getCount();

      queryBuilder.skip(skip).take(limit);

      tarefas = await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        "Erro ao executar query de tarefas",
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException(
          "NÃ£o foi possÃ­vel carregar as tarefas no momento. Tente novamente mais tarde.",
        );
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Erro interno ao consultar tarefas.",
      );
    }

    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

    const meta = {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: tarefas,
      meta,
    };
  }

  async findOne(id: number, userId: number): Promise<Tarefa> {
    // Otimizado: carregar tarefa e relações complexas em paralelo
    const [tarefa, comentarios, checklists] = await Promise.all([
      this.tarefaRepository.findOne({
        where: { id },
        relations: [
          "projeto",
          "projeto.membros",
          "coluna",
          "responsavel",
          "responsaveis",
          "criador",
          "anexos",
          "subtarefas",
          "subtarefas.responsavel",
          "subtarefas.coluna",
        ],
      }),
      this.comentarioRepository.find({
        where: { tarefaId: id },
        relations: ["autor"],
        order: { createdAt: "ASC" },
      }),
      this.checklistRepository.find({
        where: { tarefaId: id },
        relations: ["itens"],
        order: { createdAt: "ASC" },
      }),
    ]);

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    tarefa.comentarios = comentarios;
    tarefa.checklists = checklists;

    if (!tarefa.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar esta tarefa",
      );
    }

    return tarefa;
  }

  async update(
    id: number,
    updateTarefaDto: UpdateTarefaDto,
    userId: number,
  ): Promise<Tarefa> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Voce nao tem permissao para editar esta tarefa",
      );
    }

    let novoResponsavelId: number | null = null;
    const shouldUpdateResponsaveis =
      "responsavelIds" in updateTarefaDto || "responsavelId" in updateTarefaDto;

    let novosResponsaveis: User[] | null = null;
    if (shouldUpdateResponsaveis) {
      const responsavelIds = this.normalizeResponsavelIds(updateTarefaDto);
      novosResponsaveis = await this.resolveResponsaveis(
        responsavelIds,
        tarefa.projeto,
      );
      novoResponsavelId = novosResponsaveis[0]?.id ?? null;

      const responsaveisAtuais =
        tarefa.responsaveis?.length
          ? tarefa.responsaveis
          : tarefa.responsavel
            ? [tarefa.responsavel]
            : [];
      const nomesAtuais =
        responsaveisAtuais.map((usuario) => usuario.nome).join(", ") || null;
      const nomesNovos =
        novosResponsaveis.map((usuario) => usuario.nome).join(", ") || null;

      if (nomesAtuais !== nomesNovos) {
        await this.createHistoryEntry(
          id,
          userId,
          "atribuicao",
          "responsaveis",
          nomesAtuais,
          nomesNovos,
        );
      }
    }

    const changes: string[] = [];
    if (updateTarefaDto.titulo && updateTarefaDto.titulo !== tarefa.titulo) {
      changes.push(
        `Titulo alterado de "${tarefa.titulo}" para "${updateTarefaDto.titulo}"`,
      );
    }
    if (
      updateTarefaDto.prioridade &&
      updateTarefaDto.prioridade !== tarefa.prioridade
    ) {
      changes.push(
        `Prioridade alterada de ${tarefa.prioridade} para ${updateTarefaDto.prioridade}`,
      );
    }
    if (
      updateTarefaDto.prazo &&
      new Date(updateTarefaDto.prazo).getTime() !== tarefa.prazo?.getTime()
    ) {
      changes.push("Prazo alterado");
    }

    const { responsavelId, responsavelIds: _, ...payload } = updateTarefaDto;
    Object.assign(tarefa, payload);
    if (shouldUpdateResponsaveis && novosResponsaveis) {
      tarefa.responsaveis = novosResponsaveis;
      tarefa.responsavelId = novoResponsavelId;
    }
    const savedTarefa = await this.tarefaRepository.save(tarefa);

    if (changes.length > 0) {
      await this.createHistoryEntry(
        id,
        userId,
        "edicao",
        "alteracoes",
        null,
        changes.join("; "),
      );
    }

    if (novosResponsaveis && novosResponsaveis.length > 0) {
      await this.notificarAtribuicoesTarefa(
        novosResponsaveis.map((usuario) => usuario.id),
        userId,
        savedTarefa.id,
      );
    }

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para deletar esta tarefa",
      );
    }

    const colunaId = tarefa.colunaId;
    const ordem = tarefa.ordem;

    // Executar remoção dentro de transação
    await this.dataSource.transaction(async (manager) => {
      // Remover a tarefa
      await manager.remove(tarefa);

      // Reordenar tarefas após remoção
      await this.reorderTasksWithManager(manager, colunaId, ordem, "delete");
    });
  }

  async moveTarefa(
    id: number,
    moveTarefaDto: MoveTarefaDto,
    userId: number,
  ): Promise<Tarefa> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para mover esta tarefa",
      );
    }

    // Verificar se a nova coluna existe e pertence ao mesmo projeto
    const novaColuna = await this.colunaRepository.findOne({
      where: { id: moveTarefaDto.colunaId, projetoId: tarefa.projetoId },
    });

    if (!novaColuna) {
      throw new NotFoundException(
        "Coluna de destino não encontrada ou não pertence ao projeto",
      );
    }

    const colunaAnterior = tarefa.coluna;
    const colunaIdAnterior = tarefa.colunaId;
    const ordemAnterior = tarefa.ordem;

    // Executar movimentação dentro de transação
    await this.dataSource.transaction(async (manager) => {
      // Se mudou de coluna
      if (moveTarefaDto.colunaId !== tarefa.colunaId) {
        // Reordenar tarefas na coluna anterior
        await this.reorderTasksWithManager(
          manager,
          tarefa.colunaId,
          tarefa.ordem,
          "delete",
        );

        // Definir nova ordem na coluna de destino
        if (!moveTarefaDto.ordem) {
          const lastTarefa = await manager.findOne(Tarefa, {
            where: { colunaId: moveTarefaDto.colunaId },
            order: { ordem: "DESC" },
          });
          moveTarefaDto.ordem = lastTarefa ? lastTarefa.ordem + 1 : 1;
        } else {
          await this.reorderTasksWithManager(
            manager,
            moveTarefaDto.colunaId,
            moveTarefaDto.ordem,
            "insert",
          );
        }

        tarefa.colunaId = moveTarefaDto.colunaId;
        tarefa.ordem = moveTarefaDto.ordem;
      } else if (moveTarefaDto.ordem && moveTarefaDto.ordem !== tarefa.ordem) {
        // Apenas mudou de ordem na mesma coluna
        await this.reorderTasksWithManager(
          manager,
          tarefa.colunaId,
          moveTarefaDto.ordem,
          "update",
          tarefa.ordem,
        );
        tarefa.ordem = moveTarefaDto.ordem;
      }

      // Usar UPDATE SQL direto (TypeORM tem problema com cache)
      await manager.query(
        "UPDATE tarefas SET coluna_id = $1, ordem = $2 WHERE id = $3",
        [tarefa.colunaId, tarefa.ordem, id],
      );

      // Criar histórico de movimentação
      if (moveTarefaDto.colunaId !== colunaIdAnterior) {
        await this.createHistoryEntryWithManager(
          manager,
          id,
          userId,
          "movimentacao",
          "coluna",
          colunaAnterior.nome,
          novaColuna.nome,
        );
      }
    });

    // Limpar cache e buscar resultado atualizado com relações em paralelo
    await this.tarefaRepository.manager.connection.queryResultCache?.clear();

    const [resultado, comentarios, checklists] = await Promise.all([
      this.tarefaRepository.findOne({
        where: { id },
        relations: [
          "projeto",
          "projeto.membros",
          "coluna",
          "responsavel",
          "criador",
          "anexos",
        ],
      }),
      this.comentarioRepository.find({
        where: { tarefaId: id },
        relations: ["autor"],
        order: { createdAt: "ASC" },
      }),
      this.checklistRepository.find({
        where: { tarefaId: id },
        relations: ["itens"],
        order: { createdAt: "ASC" },
      }),
    ]);

    if (!resultado) {
      throw new NotFoundException("Tarefa não encontrada após salvar");
    }

    resultado.comentarios = comentarios;
    resultado.checklists = checklists;

    return resultado;
  }

  async getHistorico(id: number, userId: number): Promise<HistoricoTarefa[]> {
    const tarefa = await this.findOne(id, userId);

    return this.historicoRepository.find({
      where: { tarefaId: id },
      relations: ["usuario"],
      order: { dataAcao: "DESC" },
    });
  }

  async debugTarefa(id: number, userId: number): Promise<any> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id },
      relations: ["coluna", "projeto"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa nÃ£o encontrada");
    }

    // Query direta no banco
    const rawData = await this.tarefaRepository.query(
      "SELECT id, titulo, coluna_id, ordem FROM tarefas WHERE id = $1",
      [id],
    );

    return {
      entidade: {
        id: tarefa.id,
        titulo: tarefa.titulo,
        colunaId: tarefa.colunaId,
        ordem: tarefa.ordem,
        colunaNome: tarefa.coluna?.nome,
      },
      bancoDados: rawData[0],
      match: tarefa.colunaId === rawData[0]?.coluna_id,
    };
  }

  private async notificarAtribuicaoTarefa(
    responsavelId: number | null | undefined,
    autorId: number,
    tarefaId: number,
  ): Promise<void> {
    if (!responsavelId) {
      return;
    }

    try {
      await this.notificacoesService.notificarTarefaAtribuida(
        responsavelId,
        autorId,
        tarefaId,
      );
    } catch (error) {
      this.logger.warn("Falha ao enviar notificação de tarefa atribuída", {
        error,
      });
    }
  }

  private async notificarAtribuicoesTarefa(
    responsavelIds: number[],
    autorId: number,
    tarefaId: number,
  ): Promise<void> {
    const uniqueIds = Array.from(new Set(responsavelIds)).filter(Boolean);
    await Promise.all(
      uniqueIds.map((responsavelId) =>
        this.notificarAtribuicaoTarefa(responsavelId, autorId, tarefaId),
      ),
    );
  }

  private normalizeResponsavelIds(dto: {
    responsavelId?: number;
    responsavelIds?: number[];
  }): number[] {
    const ids = Array.isArray(dto.responsavelIds) ? dto.responsavelIds : [];
    if (dto.responsavelId) {
      ids.push(dto.responsavelId);
    }
    return Array.from(new Set(ids.filter((id) => !!id)));
  }

  private async resolveResponsaveis(
    responsavelIds: number[],
    projeto: Projeto,
  ): Promise<User[]> {
    if (!responsavelIds.length) {
      return [];
    }

    const responsaveis = await this.userRepository.find({
      where: { id: In(responsavelIds) },
    });

    if (responsaveis.length !== responsavelIds.length) {
      throw new NotFoundException("Responsável não encontrado");
    }

    const allowedIds = new Set<number>([
      projeto.criadorId,
      ...(projeto.membros?.map((m) => m.usuarioId) ?? []),
    ]);

    const invalidUser = responsaveis.find(
      (usuario) => !allowedIds.has(usuario.id),
    );

    if (invalidUser) {
      throw new BadRequestException(
        "Os responsáveis devem ser membros do projeto",
      );
    }

    return responsaveis;
  }
  private async reorderTasks(
    colunaId: number,
    targetOrder: number,
    operation: "insert" | "update" | "delete",
    currentOrder?: number,
  ): Promise<void> {
    // Usar transação com row-level locking para evitar race conditions
    await this.dataSource.transaction(async (manager) => {
      // SELECT ... FOR UPDATE: bloqueia as linhas para garantir atomicidade
      const tarefas = await manager
        .createQueryBuilder(Tarefa, "tarefa")
        .where("tarefa.colunaId = :colunaId", { colunaId })
        .orderBy("tarefa.ordem", "ASC")
        .setLock("pessimistic_write") // FOR UPDATE lock
        .getMany();

      const tarefasParaAtualizar: Tarefa[] = [];

      switch (operation) {
        case "insert":
          for (const tarefa of tarefas) {
            if (tarefa.ordem >= targetOrder) {
              tarefa.ordem += 1;
              tarefasParaAtualizar.push(tarefa);
            }
          }
          break;

        case "update":
          if (!currentOrder) return;

          if (targetOrder > currentOrder) {
            for (const tarefa of tarefas) {
              if (tarefa.ordem > currentOrder && tarefa.ordem <= targetOrder) {
                tarefa.ordem -= 1;
                tarefasParaAtualizar.push(tarefa);
              }
            }
          } else {
            for (const tarefa of tarefas) {
              if (tarefa.ordem >= targetOrder && tarefa.ordem < currentOrder) {
                tarefa.ordem += 1;
                tarefasParaAtualizar.push(tarefa);
              }
            }
          }
          break;

        case "delete":
          for (const tarefa of tarefas) {
            if (tarefa.ordem > targetOrder) {
              tarefa.ordem -= 1;
              tarefasParaAtualizar.push(tarefa);
            }
          }
          break;
      }

      // Save em batch (uma única query)
      if (tarefasParaAtualizar.length > 0) {
        await manager.save(tarefasParaAtualizar);
      }
    });
  }

  private async createHistoryEntry(
    tarefaId: number,
    usuarioId: number,
    acao: string,
    campoAlterado?: string,
    valorAnterior?: string,
    valorNovo?: string,
  ): Promise<void> {
    const historico = this.historicoRepository.create({
      tarefaId,
      usuarioId,
      acao,
      campoAlterado,
      valorAnterior,
      valorNovo,
    });

    await this.historicoRepository.save(historico);
  }

  // Versão com EntityManager para uso em transações
  private async createHistoryEntryWithManager(
    manager: any,
    tarefaId: number,
    usuarioId: number,
    acao: string,
    campoAlterado?: string,
    valorAnterior?: string,
    valorNovo?: string,
  ): Promise<void> {
    const historico = manager.create(HistoricoTarefa, {
      tarefaId,
      usuarioId,
      acao,
      campoAlterado,
      valorAnterior,
      valorNovo,
    });

    await manager.save(historico);
  }

  // Versão com EntityManager para uso em transações
  private async reorderTasksWithManager(
    manager: any,
    colunaId: number,
    targetOrder: number,
    operation: "insert" | "update" | "delete",
    currentOrder?: number,
  ): Promise<void> {
    // SELECT ... FOR UPDATE: bloqueia as linhas para garantir atomicidade
    // Evita race conditions quando múltiplos usuários movem tarefas simultaneamente
    const tarefas = await manager
      .createQueryBuilder(Tarefa, "tarefa")
      .where("tarefa.colunaId = :colunaId", { colunaId })
      .orderBy("tarefa.ordem", "ASC")
      .setLock("pessimistic_write") // FOR UPDATE lock
      .getMany();

    const tarefasParaAtualizar: Tarefa[] = [];

    switch (operation) {
      case "insert":
        for (const tarefa of tarefas) {
          if (tarefa.ordem >= targetOrder) {
            tarefa.ordem += 1;
            tarefasParaAtualizar.push(tarefa);
          }
        }
        break;

      case "update":
        if (!currentOrder) return;

        if (targetOrder > currentOrder) {
          for (const tarefa of tarefas) {
            if (tarefa.ordem > currentOrder && tarefa.ordem <= targetOrder) {
              tarefa.ordem -= 1;
              tarefasParaAtualizar.push(tarefa);
            }
          }
        } else {
          for (const tarefa of tarefas) {
            if (tarefa.ordem >= targetOrder && tarefa.ordem < currentOrder) {
              tarefa.ordem += 1;
              tarefasParaAtualizar.push(tarefa);
            }
          }
        }
        break;

      case "delete":
        for (const tarefa of tarefas) {
          if (tarefa.ordem > targetOrder) {
            tarefa.ordem -= 1;
            tarefasParaAtualizar.push(tarefa);
          }
        }
        break;
    }

    // Save em batch (uma única query)
    if (tarefasParaAtualizar.length > 0) {
      await manager.save(tarefasParaAtualizar);
    }
  }

  async getTarefasAtrasadas(
    projetoId: number,
    userId: number,
  ): Promise<Tarefa[]> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ["membros"],
    });

    if (!projeto || !projeto.canUserView(userId)) {
      throw new ForbiddenException("Acesso negado ao projeto");
    }

    const hoje = new Date();
    return this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoinAndSelect("tarefa.coluna", "coluna")
      .leftJoinAndSelect("tarefa.responsavel", "responsavel")
      .leftJoinAndSelect("tarefa.responsaveis", "responsaveis")
      .where("tarefa.projetoId = :projetoId", { projetoId })
      .andWhere("tarefa.prazo < :hoje", { hoje })
      .andWhere("coluna.nome != :concluido", { concluido: "ConcluÃ­do" })
      .orderBy("tarefa.prazo", "ASC")
      .getMany();
  }

  async getEstatisticasProjeto(
    projetoId: number,
    userId: number,
  ): Promise<any> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ["membros"],
    });

    if (!projeto || !projeto.canUserView(userId)) {
      throw new ForbiddenException("Acesso negado ao projeto");
    }

    const hoje = new Date();

    // Otimização: Uma única query com agregações
    const stats = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoin("tarefa.coluna", "coluna")
      .select("COUNT(*)", "total")
      .addSelect(
        `SUM(CASE WHEN coluna.nome = 'Concluído' THEN 1 ELSE 0 END)`,
        "concluidas",
      )
      .addSelect(
        `SUM(CASE WHEN coluna.nome = 'Em Andamento' THEN 1 ELSE 0 END)`,
        "emAndamento",
      )
      .addSelect(
        `SUM(CASE WHEN tarefa.prazo < :hoje AND coluna.nome != 'Concluído' THEN 1 ELSE 0 END)`,
        "atrasadas",
      )
      .where("tarefa.projetoId = :projetoId", { projetoId, hoje })
      .getRawOne();

    // Query separada apenas para prioridades (agregação diferente)
    const porPrioridade = await this.tarefaRepository
      .createQueryBuilder("tarefa")
      .select("tarefa.prioridade", "prioridade")
      .addSelect("COUNT(*)", "count")
      .where("tarefa.projetoId = :projetoId", { projetoId })
      .groupBy("tarefa.prioridade")
      .getRawMany();

    const total = parseInt(stats.total) || 0;
    const concluidas = parseInt(stats.concluidas) || 0;
    const emAndamento = parseInt(stats.emAndamento) || 0;
    const atrasadas = parseInt(stats.atrasadas) || 0;

    return {
      total,
      concluidas,
      emAndamento,
      pendentes: total - concluidas - emAndamento,
      atrasadas,
      porPrioridade: porPrioridade.reduce((acc, item) => {
        acc[item.prioridade] = parseInt(item.count);
        return acc;
      }, {}),
      percentualConclusao:
        total > 0 ? Math.round((concluidas / total) * 100) : 0,
    };
  }

  async getTarefasUsuario(
    userId: number,
    queryDto?: Partial<QueryTarefaDto>,
  ): Promise<Tarefa[]> {
    const queryBuilder = this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoinAndSelect("tarefa.coluna", "coluna")
      .leftJoinAndSelect("tarefa.projeto", "projeto")
      .leftJoinAndSelect("tarefa.criador", "criador")
      .leftJoinAndSelect("tarefa.responsaveis", "responsaveis")
      .where("(tarefa.responsavelId = :userId OR responsaveis.id = :userId)", {
        userId,
      })
      .distinct(true);

    if (queryDto?.prioridade) {
      queryBuilder.andWhere("tarefa.prioridade = :prioridade", {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto?.search) {
      queryBuilder.andWhere(
        "(tarefa.titulo ILIKE :search OR tarefa.descricao ILIKE :search)",
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto?.atrasadas) {
      const hoje = new Date();
      queryBuilder.andWhere("tarefa.prazo < :hoje", { hoje });
      queryBuilder.andWhere("coluna.nome != :concluido", {
        concluido: "ConcluÃ­do",
      });
    }

    return queryBuilder
      .orderBy("tarefa.prazo", "ASC")
      .addOrderBy("tarefa.prioridade", "DESC")
      .getMany();
  }

  async duplicarTarefa(id: number, userId: number): Promise<Tarefa> {
    const tarefaOriginal = await this.findOne(id, userId);

    if (!tarefaOriginal.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "VocÃª nÃ£o tem permissÃ£o para duplicar esta tarefa",
      );
    }

    const createDto: CreateTarefaDto = {
      projetoId: tarefaOriginal.projetoId,
      colunaId: tarefaOriginal.colunaId,
      titulo: `${tarefaOriginal.titulo} (CÃ³pia)`,
      descricao: tarefaOriginal.descricao,
      prioridade: tarefaOriginal.prioridade,
      tags: tarefaOriginal.tags,
      responsavelIds: tarefaOriginal.responsaveis?.map((usuario) => usuario.id),
    };

    return this.create(createDto, userId);
  }

  async arquivarTarefa(id: number, userId: number): Promise<Tarefa> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para arquivar esta tarefa",
      );
    }

    // Executar arquivamento dentro de transação
    let colunaArquivadasId: number;

    await this.dataSource.transaction(async (manager) => {
      // Encontrar ou criar coluna "Arquivadas"
      let colunaArquivadas = await manager.findOne(Coluna, {
        where: { projetoId: tarefa.projetoId, nome: "Arquivadas" },
      });

      if (!colunaArquivadas) {
        const ultimaOrdem = await manager
          .createQueryBuilder(Coluna, "coluna")
          .where("coluna.projetoId = :projetoId", {
            projetoId: tarefa.projetoId,
          })
          .orderBy("coluna.ordem", "DESC")
          .getOne();

        colunaArquivadas = manager.create(Coluna, {
          projetoId: tarefa.projetoId,
          nome: "Arquivadas",
          ordem: ultimaOrdem ? ultimaOrdem.ordem + 1 : 1,
        });
        colunaArquivadas = await manager.save(colunaArquivadas);
      }

      colunaArquivadasId = colunaArquivadas.id;
    });

    // Mover tarefa para coluna arquivadas (moveTarefa já tem sua própria transação)
    const moveTarefaDto: MoveTarefaDto = {
      colunaId: colunaArquivadasId,
    };

    return this.moveTarefa(id, moveTarefaDto, userId);
  }

  // ========== NOVOS MÃ‰TODOS DE FILTROS AVANÃ‡ADOS ==========

  async buscarComFiltros(
    filtros: FiltrosTarefasDto,
  ): Promise<{ tarefas: Tarefa[]; grupos?: Record<string, Tarefa[]> }> {
    const { TarefasFiltrosService } = await import("./tarefas-filtros.service");
    const filtrosService = new TarefasFiltrosService(this.tarefaRepository);
    return filtrosService.buscarEAgrupar(filtros);
  }

  async getEstatisticas(filtros: FiltrosTarefasDto): Promise<any> {
    const { TarefasFiltrosService } = await import("./tarefas-filtros.service");
    const filtrosService = new TarefasFiltrosService(this.tarefaRepository);
    return filtrosService.getEstatisticas(filtros);
  }
}
