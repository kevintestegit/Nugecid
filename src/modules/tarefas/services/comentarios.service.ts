import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Comentario, Tarefa, HistoricoTarefa } from "../entities";
import { CreateComentarioDto, UpdateComentarioDto } from "../dto";
import { User } from "../../users/entities/user.entity";
import { NotificacoesService } from "../../notificacoes/services";

@Injectable()
export class ComentariosService {
  private readonly logger = new Logger(ComentariosService.name);

  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
    @InjectRepository(HistoricoTarefa)
    private readonly historicoRepository: Repository<HistoricoTarefa>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  async create(
    createComentarioDto: CreateComentarioDto,
    autorId: number,
  ): Promise<Comentario> {
    // Verificar se a tarefa existe e se o usuário tem acesso
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: createComentarioDto.tarefaId },
      relations: ["projeto", "projeto.membros"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    if (!tarefa.projeto.canUserView(autorId)) {
      throw new ForbiddenException(
        "Você não tem permissão para comentar nesta tarefa",
      );
    }

    const comentario = this.comentarioRepository.create({
      ...createComentarioDto,
      autorId,
    });

    const savedComentario = await this.comentarioRepository.save(comentario);
    try {
      await this.handleMentions(
        createComentarioDto.conteudo,
        createComentarioDto.tarefaId,
        autorId,
      );
    } catch (error) {
      this.logger.warn("Falha ao processar men��es em coment�rio", { error });
    }
    // Criar histórico
    await this.createHistoryEntry(
      createComentarioDto.tarefaId,
      autorId,
      "comentario",
      null,
      "Comentário adicionado",
    );

    return this.findOne(savedComentario.id, autorId);
  }

  async findAll(tarefaId: number, userId: number): Promise<Comentario[]> {
    // Verificar se a tarefa existe e se o usuário tem acesso
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto", "projeto.membros"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    if (!tarefa.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar os comentários desta tarefa",
      );
    }

    return this.comentarioRepository.find({
      where: { tarefaId },
      relations: ["autor"],
      order: { createdAt: "ASC" },
    });
  }

  async findOne(id: number, userId: number): Promise<Comentario> {
    const comentario = await this.comentarioRepository.findOne({
      where: { id },
      relations: [
        "autor",
        "tarefa",
        "tarefa.projeto",
        "tarefa.projeto.membros",
      ],
    });

    if (!comentario) {
      throw new NotFoundException("Comentário não encontrado");
    }

    if (!comentario.tarefa.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar este comentário",
      );
    }

    return comentario;
  }

  async update(
    id: number,
    updateComentarioDto: UpdateComentarioDto,
    userId: number,
  ): Promise<Comentario> {
    const comentario = await this.findOne(id, userId);

    // Apenas o autor do comentário pode editá-lo
    if (comentario.autorId !== userId) {
      throw new ForbiddenException(
        "Você só pode editar seus próprios comentários",
      );
    }

    // Verificar se o comentário não é muito antigo (ex: 24 horas)
    const horasLimite = 24;
    const agora = new Date();
    const criadoEm = new Date(comentario.createdAt);
    const diferencaHoras =
      (agora.getTime() - criadoEm.getTime()) / (1000 * 60 * 60);

    if (diferencaHoras > horasLimite) {
      throw new ForbiddenException(
        "Não é possível editar comentários após 24 horas",
      );
    }

    const conteudoAnterior = comentario.conteudo;
    Object.assign(comentario, updateComentarioDto);
    comentario.editado = true;

    const savedComentario = await this.comentarioRepository.save(comentario);

    // Criar histórico de edição
    await this.createHistoryEntry(
      comentario.tarefaId,
      userId,
      "edicao",
      conteudoAnterior,
      comentario.conteudo,
    );

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const comentario = await this.findOne(id, userId);

    // Apenas o autor do comentário ou admin do projeto pode deletá-lo
    const isAuthor = comentario.autorId === userId;
    const isProjectAdmin =
      comentario.tarefa.projeto.isOwner(userId) ||
      comentario.tarefa.projeto.membros?.some(
        (m) => m.usuarioId === userId && m.canManageMembers(),
      );

    if (!isAuthor && !isProjectAdmin) {
      throw new ForbiddenException(
        "Você não tem permissão para deletar este comentário",
      );
    }

    // Verificar se o comentário não é muito antigo (apenas para autor)
    if (isAuthor && !isProjectAdmin) {
      const horasLimite = 24;
      const agora = new Date();
      const criadoEm = new Date(comentario.createdAt);
      const diferencaHoras =
        (agora.getTime() - criadoEm.getTime()) / (1000 * 60 * 60);

      if (diferencaHoras > horasLimite) {
        throw new ForbiddenException(
          "Não é possível deletar comentários após 24 horas",
        );
      }
    }

    await this.comentarioRepository.remove(comentario);

    // Criar histórico de exclusão
    await this.createHistoryEntry(
      comentario.tarefaId,
      userId,
      "exclusao",
      comentario.conteudo,
      null,
    );
  }

  async getComentariosPorPeriodo(
    tarefaId: number,
    dataInicio: Date,
    dataFim: Date,
    userId: number,
  ): Promise<Comentario[]> {
    // Verificar se a tarefa existe e se o usuário tem acesso
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto", "projeto.membros"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    if (!tarefa.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar os comentários desta tarefa",
      );
    }

    return this.comentarioRepository
      .createQueryBuilder("comentario")
      .leftJoinAndSelect("comentario.autor", "autor")
      .where("comentario.tarefaId = :tarefaId", { tarefaId })
      .andWhere("comentario.createdAt >= :dataInicio", { dataInicio })
      .andWhere("comentario.createdAt <= :dataFim", { dataFim })
      .orderBy("comentario.createdAt", "ASC")
      .getMany();
  }

  async getEstatisticasComentarios(tarefaId: number, userId: number) {
    // Verificar se a tarefa existe e se o usuário tem acesso
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId },
      relations: ["projeto", "projeto.membros"],
    });

    if (!tarefa) {
      throw new NotFoundException("Tarefa não encontrada");
    }

    if (!tarefa.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar as estatísticas desta tarefa",
      );
    }

    const comentarios = await this.comentarioRepository.find({
      where: { tarefaId },
      relations: ["autor"],
    });

    const stats = {
      totalComentarios: comentarios.length,
      comentariosEditados: comentarios.filter((c) => c.editado).length,
      autorMaisAtivo: null as string | null,
      ultimoComentario: null as Date | null,
      comentariosPorAutor: {} as Record<string, number>,
    };

    if (comentarios.length > 0) {
      // Último comentário
      const ultimoComentario = comentarios.reduce((ultimo, atual) =>
        new Date(atual.createdAt) > new Date(ultimo.createdAt) ? atual : ultimo,
      );
      stats.ultimoComentario = ultimoComentario.createdAt;

      // Comentários por autor
      comentarios.forEach((comentario) => {
        const nomeAutor = comentario.autor.nome;
        stats.comentariosPorAutor[nomeAutor] =
          (stats.comentariosPorAutor[nomeAutor] || 0) + 1;
      });

      // Autor mais ativo
      const autorMaisAtivo = Object.entries(stats.comentariosPorAutor).reduce(
        (a, b) => (a[1] > b[1] ? a : b),
      );
      stats.autorMaisAtivo = autorMaisAtivo[0];
    }

    return stats;
  }

  private extractMentions(text: string): string[] {
    if (!text) {
      return [];
    }

    const regex = /@([a-zA-Z0-9._-]+)/g;
    const mentions = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      mentions.add(match[1]);
    }

    return Array.from(mentions);
  }

  private async handleMentions(
    conteudo: string,
    tarefaId: number,
    autorId: number,
  ): Promise<void> {
    const mencoes = this.extractMentions(conteudo);

    if (mencoes.length === 0) {
      return;
    }

    const usuarios = await this.userRepository.find({
      where: { usuario: In(mencoes) },
    });

    if (!usuarios.length) {
      return;
    }

    await Promise.all(
      usuarios
        .filter((usuario) => usuario.id !== autorId)
        .map((usuario) =>
          this.notificacoesService.notificarMencao(
            usuario.id,
            autorId,
            tarefaId,
            conteudo,
          ),
        ),
    );
  }
  private async createHistoryEntry(
    tarefaId: number,
    usuarioId: number,
    acao: string,
    valorAnterior?: string,
    valorNovo?: string,
  ): Promise<void> {
    const historico = this.historicoRepository.create({
      tarefaId,
      usuarioId,
      acao,
      campoAlterado: "comentario",
      valorAnterior,
      valorNovo,
    });

    await this.historicoRepository.save(historico);
  }
}
