import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import {
  Tarefa,
  Projeto,
  Coluna,
  HistoricoTarefa,
  TipoAcaoHistorico,
} from '../entities';
import {
  CreateTarefaDto,
  UpdateTarefaDto,
  MoveTarefaDto,
  QueryTarefaDto,
} from '../dto';
import { User } from '../../users/entities/user.entity';

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
  ) {}

  async create(
    createTarefaDto: CreateTarefaDto,
    criadorId: number,
  ): Promise<Tarefa> {
    // Verificar se o projeto existe e se o usuário tem acesso
    const projeto = await this.projetoRepository.findOne({
      where: { id: createTarefaDto.projetoId },
      relations: ['membros'],
    });

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!projeto.canUserEdit(criadorId)) {
      throw new ForbiddenException(
        'Você não tem permissão para criar tarefas neste projeto',
      );
    }

    // Verificar se a coluna existe e pertence ao projeto
    const coluna = await this.colunaRepository.findOne({
      where: {
        id: createTarefaDto.colunaId,
        projetoId: createTarefaDto.projetoId,
      },
    });

    if (!coluna) {
      throw new NotFoundException(
        'Coluna não encontrada ou não pertence ao projeto',
      );
    }

    // Verificar se o responsável existe e é membro do projeto (se especificado)
    if (createTarefaDto.responsavelId) {
      const responsavel = await this.userRepository.findOne({
        where: { id: createTarefaDto.responsavelId },
      });

      if (!responsavel) {
        throw new NotFoundException('Responsável não encontrado');
      }

      const isMember =
        projeto.criadorId === createTarefaDto.responsavelId ||
        projeto.membros?.some(
          m => m.usuarioId === createTarefaDto.responsavelId,
        );

      if (!isMember) {
        throw new BadRequestException(
          'O responsável deve ser membro do projeto',
        );
      }
    }

    // Se não foi especificada uma ordem, colocar no final da coluna
    if (!createTarefaDto.ordem) {
      const lastTarefa = await this.tarefaRepository.findOne({
        where: { colunaId: createTarefaDto.colunaId },
        order: { ordem: 'DESC' },
      });
      createTarefaDto.ordem = lastTarefa ? lastTarefa.ordem + 1 : 1;
    } else {
      // Reordenar tarefas existentes se necessário
      await this.reorderTasks(
        createTarefaDto.colunaId,
        createTarefaDto.ordem,
        'insert',
      );
    }

    const tarefa = this.tarefaRepository.create({
      ...createTarefaDto,
      criadorId,
    });

    const savedTarefa = await this.tarefaRepository.save(tarefa);

    // Criar histórico
    await this.createHistoryEntry(
      savedTarefa.id,
      criadorId,
      TipoAcaoHistorico.CRIACAO,
      'Tarefa criada',
    );

    return this.findOne(savedTarefa.id, criadorId);
  }

  async findAll(projetoId: number, userId: number): Promise<Tarefa[]> {
    // Verificar se o projeto existe e se o usuário tem acesso
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ['membros'],
    });

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!projeto.canUserView(userId)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este projeto',
      );
    }

    return this.tarefaRepository.find({
      where: { projetoId },
      relations: ['coluna', 'responsavel', 'criador'],
      order: { colunaId: 'ASC', ordem: 'ASC' },
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
    // Verificar se o projeto existe e se o usuário tem acesso
    if (queryDto.projetoId) {
      const projeto = await this.projetoRepository.findOne({
        where: { id: queryDto.projetoId },
        relations: ['membros'],
      });

      if (!projeto) {
        throw new NotFoundException('Projeto não encontrado');
      }

      if (!projeto.canUserView(userId)) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este projeto',
        );
      }
    }

    // Verificar se o repositório está inicializado corretamente
    if (!this.tarefaRepository || !this.tarefaRepository.metadata) {
      throw new Error(
        'Repositório de tarefas não está inicializado corretamente',
      );
    }

    const queryBuilder = this.tarefaRepository
      .createQueryBuilder('tarefa')
      .leftJoinAndSelect('tarefa.coluna', 'coluna')
      .leftJoinAndSelect('tarefa.responsavel', 'responsavel')
      .leftJoinAndSelect('tarefa.criador', 'criador')
      .leftJoinAndSelect('tarefa.projeto', 'projeto');

    // Aplicar filtros
    if (queryDto.projetoId) {
      queryBuilder.andWhere('tarefa.projetoId = :projetoId', {
        projetoId: queryDto.projetoId,
      });
    }

    if (queryDto.colunaId) {
      queryBuilder.andWhere('tarefa.colunaId = :colunaId', {
        colunaId: queryDto.colunaId,
      });
    }

    if (queryDto.responsavelId) {
      queryBuilder.andWhere('tarefa.responsavelId = :responsavelId', {
        responsavelId: queryDto.responsavelId,
      });
    }

    if (queryDto.prioridade) {
      queryBuilder.andWhere('tarefa.prioridade = :prioridade', {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(tarefa.titulo ILIKE :search OR tarefa.descricao ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto.tags && queryDto.tags.length > 0) {
      queryBuilder.andWhere('tarefa.tags && :tags', { tags: queryDto.tags });
    }

    if (queryDto.dataInicio) {
      queryBuilder.andWhere('tarefa.prazo >= :dataInicio', {
        dataInicio: queryDto.dataInicio,
      });
    }

    if (queryDto.dataFim) {
      queryBuilder.andWhere('tarefa.prazo <= :dataFim', {
        dataFim: queryDto.dataFim,
      });
    }

    if (queryDto.atrasadas) {
      const hoje = new Date();
      queryBuilder.andWhere('tarefa.prazo < :hoje', { hoje });
      queryBuilder.andWhere('coluna.nome != :concluido', {
        concluido: 'Concluído',
      });
    }

    // Aplicar ordenação
    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder = queryDto.sortOrder || 'DESC';

    // Lógica de ordenação
    switch (sortBy) {
      case 'id':
        queryBuilder.orderBy('tarefa.id', sortOrder as 'ASC' | 'DESC');
        break;
      case 'titulo':
        queryBuilder.orderBy('tarefa.titulo', sortOrder as 'ASC' | 'DESC');
        break;
      case 'descricao':
        queryBuilder.orderBy('tarefa.descricao', sortOrder as 'ASC' | 'DESC');
        break;
      case 'prazo':
        queryBuilder.orderBy('tarefa.prazo', sortOrder as 'ASC' | 'DESC');
        break;
      case 'prioridade':
        queryBuilder.orderBy('tarefa.prioridade', sortOrder as 'ASC' | 'DESC');
        break;
      case 'updatedAt':
        queryBuilder.orderBy('tarefa.updatedAt', sortOrder as 'ASC' | 'DESC');
        break;
      case 'ordem':
        queryBuilder
          .orderBy('tarefa.colunaId', 'ASC')
          .addOrderBy('tarefa.ordem', sortOrder as 'ASC' | 'DESC');
        break;
      case 'coluna':
        queryBuilder.orderBy('coluna.nome', sortOrder as 'ASC' | 'DESC');
        break;
      case 'projeto':
        queryBuilder.orderBy('projeto.nome', sortOrder as 'ASC' | 'DESC');
        break;
      case 'responsavel':
        queryBuilder.orderBy('responsavel.nome', sortOrder as 'ASC' | 'DESC');
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('tarefa.createdAt', sortOrder as 'ASC' | 'DESC');
        break;
    }

    // Contar total
    let total = 0;
    let tarefas: Tarefa[] = [];

    // Aplicar paginação
    const page = queryDto.page || 1;
    const limit = queryDto.limit && queryDto.limit > 0 ? queryDto.limit : 10;
    const skip = (page - 1) * limit;

    try {
      total = await queryBuilder.getCount();

      queryBuilder.skip(skip).take(limit);

      tarefas = await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        'Erro ao executar query de tarefas',
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException(
          'Não foi possível carregar as tarefas no momento. Tente novamente mais tarde.',
        );
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Erro interno ao consultar tarefas.',
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
    const tarefa = await this.tarefaRepository.findOne({
      where: { id },
      relations: [
        'projeto',
        'projeto.membros',
        'coluna',
        'responsavel',
        'criador',
        'comentarios',
        'comentarios.autor',
        'anexos',
        'checklists',
        'checklists.itens',
      ],
    });

    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (!tarefa.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta tarefa',
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
        'Você não tem permissão para editar esta tarefa',
      );
    }

    // Verificar se o responsável existe e é membro do projeto (se especificado)
    if (
      updateTarefaDto.responsavelId &&
      updateTarefaDto.responsavelId !== tarefa.responsavelId
    ) {
      const responsavel = await this.userRepository.findOne({
        where: { id: updateTarefaDto.responsavelId },
      });

      if (!responsavel) {
        throw new NotFoundException('Responsável não encontrado');
      }

      const isMember =
        tarefa.projeto.criadorId === updateTarefaDto.responsavelId ||
        tarefa.projeto.membros?.some(
          m => m.usuarioId === updateTarefaDto.responsavelId,
        );

      if (!isMember) {
        throw new BadRequestException(
          'O responsável deve ser membro do projeto',
        );
      }

      // Criar histórico de atribuição
      await this.createHistoryEntry(
        id,
        userId,
        TipoAcaoHistorico.ATRIBUICAO,
        `Tarefa atribuída para ${responsavel.nome}`,
        {
          responsavelAnterior: tarefa.responsavel?.nome,
          novoResponsavel: responsavel.nome,
        },
      );
    }

    // Verificar mudanças importantes para histórico
    const changes: string[] = [];
    if (updateTarefaDto.titulo && updateTarefaDto.titulo !== tarefa.titulo) {
      changes.push(
        `Título alterado de "${tarefa.titulo}" para "${updateTarefaDto.titulo}"`,
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
      changes.push(`Prazo alterado`);
    }

    Object.assign(tarefa, updateTarefaDto);
    const savedTarefa = await this.tarefaRepository.save(tarefa);

    // Criar histórico se houve mudanças
    if (changes.length > 0) {
      await this.createHistoryEntry(
        id,
        userId,
        TipoAcaoHistorico.EDICAO,
        changes.join('; '),
      );
    }

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta tarefa',
      );
    }

    // Reordenar tarefas após remoção
    await this.reorderTasks(tarefa.colunaId, tarefa.ordem, 'delete');

    await this.tarefaRepository.remove(tarefa);
  }

  async moveTarefa(
    id: number,
    moveTarefaDto: MoveTarefaDto,
    userId: number,
  ): Promise<Tarefa> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        'Você não tem permissão para mover esta tarefa',
      );
    }

    // Verificar se a nova coluna existe e pertence ao mesmo projeto
    const novaColuna = await this.colunaRepository.findOne({
      where: { id: moveTarefaDto.colunaId, projetoId: tarefa.projetoId },
    });

    if (!novaColuna) {
      throw new NotFoundException(
        'Coluna de destino não encontrada ou não pertence ao projeto',
      );
    }

    const colunaAnterior = tarefa.coluna;
    const ordemAnterior = tarefa.ordem;

    // Se mudou de coluna
    if (moveTarefaDto.colunaId !== tarefa.colunaId) {
      // Reordenar tarefas na coluna anterior
      await this.reorderTasks(tarefa.colunaId, tarefa.ordem, 'delete');

      // Definir nova ordem na coluna de destino
      if (!moveTarefaDto.ordem) {
        const lastTarefa = await this.tarefaRepository.findOne({
          where: { colunaId: moveTarefaDto.colunaId },
          order: { ordem: 'DESC' },
        });
        moveTarefaDto.ordem = lastTarefa ? lastTarefa.ordem + 1 : 1;
      } else {
        await this.reorderTasks(
          moveTarefaDto.colunaId,
          moveTarefaDto.ordem,
          'insert',
        );
      }

      tarefa.colunaId = moveTarefaDto.colunaId;
      tarefa.ordem = moveTarefaDto.ordem;
    } else if (moveTarefaDto.ordem && moveTarefaDto.ordem !== tarefa.ordem) {
      // Apenas mudou de ordem na mesma coluna
      await this.reorderTasks(
        tarefa.colunaId,
        moveTarefaDto.ordem,
        'update',
        tarefa.ordem,
      );
      tarefa.ordem = moveTarefaDto.ordem;
    }

    const savedTarefa = await this.tarefaRepository.save(tarefa);

    // Criar histórico de movimentação
    if (moveTarefaDto.colunaId !== colunaAnterior.id) {
      await this.createHistoryEntry(
        id,
        userId,
        TipoAcaoHistorico.MOVIMENTACAO,
        `Tarefa movida de "${colunaAnterior.nome}" para "${novaColuna.nome}"`,
        { colunaAnterior: colunaAnterior.nome, novaColuna: novaColuna.nome },
      );
    }

    return this.findOne(id, userId);
  }

  async getHistorico(id: number, userId: number): Promise<HistoricoTarefa[]> {
    const tarefa = await this.findOne(id, userId);

    return this.historicoRepository.find({
      where: { tarefaId: id },
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  private async reorderTasks(
    colunaId: number,
    targetOrder: number,
    operation: 'insert' | 'update' | 'delete',
    currentOrder?: number,
  ): Promise<void> {
    const tarefas = await this.tarefaRepository.find({
      where: { colunaId },
      order: { ordem: 'ASC' },
    });

    switch (operation) {
      case 'insert':
        for (const tarefa of tarefas) {
          if (tarefa.ordem >= targetOrder) {
            tarefa.ordem += 1;
            await this.tarefaRepository.save(tarefa);
          }
        }
        break;

      case 'update':
        if (!currentOrder) return;

        if (targetOrder > currentOrder) {
          for (const tarefa of tarefas) {
            if (tarefa.ordem > currentOrder && tarefa.ordem <= targetOrder) {
              tarefa.ordem -= 1;
              await this.tarefaRepository.save(tarefa);
            }
          }
        } else {
          for (const tarefa of tarefas) {
            if (tarefa.ordem >= targetOrder && tarefa.ordem < currentOrder) {
              tarefa.ordem += 1;
              await this.tarefaRepository.save(tarefa);
            }
          }
        }
        break;

      case 'delete':
        for (const tarefa of tarefas) {
          if (tarefa.ordem > targetOrder) {
            tarefa.ordem -= 1;
            await this.tarefaRepository.save(tarefa);
          }
        }
        break;
    }
  }

  private async createHistoryEntry(
    tarefaId: number,
    usuarioId: number,
    acao: TipoAcaoHistorico,
    descricao: string,
    dadosAnteriores?: any,
  ): Promise<void> {
    const historico = this.historicoRepository.create({
      tarefaId,
      usuarioId,
      acao,
      descricao,
      dadosAnteriores,
    });

    await this.historicoRepository.save(historico);
  }

  async getTarefasAtrasadas(
    projetoId: number,
    userId: number,
  ): Promise<Tarefa[]> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ['membros'],
    });

    if (!projeto || !projeto.canUserView(userId)) {
      throw new ForbiddenException('Acesso negado ao projeto');
    }

    const hoje = new Date();
    return this.tarefaRepository
      .createQueryBuilder('tarefa')
      .leftJoinAndSelect('tarefa.coluna', 'coluna')
      .leftJoinAndSelect('tarefa.responsavel', 'responsavel')
      .where('tarefa.projetoId = :projetoId', { projetoId })
      .andWhere('tarefa.prazo < :hoje', { hoje })
      .andWhere('coluna.nome != :concluido', { concluido: 'Concluído' })
      .orderBy('tarefa.prazo', 'ASC')
      .getMany();
  }

  async getEstatisticasProjeto(
    projetoId: number,
    userId: number,
  ): Promise<any> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ['membros'],
    });

    if (!projeto || !projeto.canUserView(userId)) {
      throw new ForbiddenException('Acesso negado ao projeto');
    }

    const [total, concluidas, emAndamento, atrasadas, porPrioridade] =
      await Promise.all([
        this.tarefaRepository.count({ where: { projetoId } }),
        this.tarefaRepository
          .createQueryBuilder('tarefa')
          .leftJoin('tarefa.coluna', 'coluna')
          .where('tarefa.projetoId = :projetoId', { projetoId })
          .andWhere('coluna.nome = :concluido', { concluido: 'Concluído' })
          .getCount(),
        this.tarefaRepository
          .createQueryBuilder('tarefa')
          .leftJoin('tarefa.coluna', 'coluna')
          .where('tarefa.projetoId = :projetoId', { projetoId })
          .andWhere('coluna.nome = :emAndamento', {
            emAndamento: 'Em Andamento',
          })
          .getCount(),
        this.tarefaRepository
          .createQueryBuilder('tarefa')
          .leftJoin('tarefa.coluna', 'coluna')
          .where('tarefa.projetoId = :projetoId', { projetoId })
          .andWhere('tarefa.prazo < :hoje', { hoje: new Date() })
          .andWhere('coluna.nome != :concluido', { concluido: 'Concluído' })
          .getCount(),
        this.tarefaRepository
          .createQueryBuilder('tarefa')
          .select('tarefa.prioridade', 'prioridade')
          .addSelect('COUNT(*)', 'count')
          .where('tarefa.projetoId = :projetoId', { projetoId })
          .groupBy('tarefa.prioridade')
          .getRawMany(),
      ]);

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
      .createQueryBuilder('tarefa')
      .leftJoinAndSelect('tarefa.coluna', 'coluna')
      .leftJoinAndSelect('tarefa.projeto', 'projeto')
      .leftJoinAndSelect('tarefa.criador', 'criador')
      .where('tarefa.responsavelId = :userId', { userId });

    if (queryDto?.prioridade) {
      queryBuilder.andWhere('tarefa.prioridade = :prioridade', {
        prioridade: queryDto.prioridade,
      });
    }

    if (queryDto?.search) {
      queryBuilder.andWhere(
        '(tarefa.titulo ILIKE :search OR tarefa.descricao ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto?.atrasadas) {
      const hoje = new Date();
      queryBuilder.andWhere('tarefa.prazo < :hoje', { hoje });
      queryBuilder.andWhere('coluna.nome != :concluido', {
        concluido: 'Concluído',
      });
    }

    return queryBuilder
      .orderBy('tarefa.prazo', 'ASC')
      .addOrderBy('tarefa.prioridade', 'DESC')
      .getMany();
  }

  async duplicarTarefa(id: number, userId: number): Promise<Tarefa> {
    const tarefaOriginal = await this.findOne(id, userId);

    if (!tarefaOriginal.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        'Você não tem permissão para duplicar esta tarefa',
      );
    }

    const createDto: CreateTarefaDto = {
      projetoId: tarefaOriginal.projetoId,
      colunaId: tarefaOriginal.colunaId,
      titulo: `${tarefaOriginal.titulo} (Cópia)`,
      descricao: tarefaOriginal.descricao,
      prioridade: tarefaOriginal.prioridade,
      tags: tarefaOriginal.tags,
    };

    return this.create(createDto, userId);
  }

  async arquivarTarefa(id: number, userId: number): Promise<Tarefa> {
    const tarefa = await this.findOne(id, userId);

    if (!tarefa.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        'Você não tem permissão para arquivar esta tarefa',
      );
    }

    // Encontrar ou criar coluna "Arquivadas"
    let colunaArquivadas = await this.colunaRepository.findOne({
      where: { projetoId: tarefa.projetoId, nome: 'Arquivadas' },
    });

    if (!colunaArquivadas) {
      const ultimaOrdem = await this.colunaRepository
        .createQueryBuilder('coluna')
        .where('coluna.projetoId = :projetoId', { projetoId: tarefa.projetoId })
        .orderBy('coluna.ordem', 'DESC')
        .getOne();

      colunaArquivadas = this.colunaRepository.create({
        projetoId: tarefa.projetoId,
        nome: 'Arquivadas',
        ordem: ultimaOrdem ? ultimaOrdem.ordem + 1 : 1,
      });
      await this.colunaRepository.save(colunaArquivadas);
    }

    // Mover tarefa para coluna arquivadas
    const moveTarefaDto: MoveTarefaDto = {
      colunaId: colunaArquivadas.id,
    };

    return this.moveTarefa(id, moveTarefaDto, userId);
  }
}
