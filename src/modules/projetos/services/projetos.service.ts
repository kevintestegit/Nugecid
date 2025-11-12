import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Projeto, MembroProjeto, PapelMembro, Coluna } from "../entities";
import {
  CreateProjetoDto,
  UpdateProjetoDto,
  AddMembroProjetoDto,
  UpdateMembroProjetoDto,
} from "../dto";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class ProjetosService {
  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(MembroProjeto)
    private readonly membroProjetoRepository: Repository<MembroProjeto>,
    @InjectRepository(Coluna)
    private readonly colunaRepository: Repository<Coluna>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createProjetoDto: CreateProjetoDto,
    criadorId: number,
  ): Promise<Projeto> {
    // Verificar se o usuário existe
    const criador = await this.userRepository.findOne({
      where: { id: criadorId },
    });
    if (!criador) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // Criar o projeto
    const projeto = this.projetoRepository.create({
      ...createProjetoDto,
      criadorId,
    });

    const savedProjeto = await this.projetoRepository.save(projeto);

    // Criar colunas padrão
    await this.createDefaultColumns(savedProjeto.id);

    return this.findOne(savedProjeto.id, criadorId);
  }

  async findAll(userId: number): Promise<Projeto[]> {
    return this.projetoRepository
      .createQueryBuilder("projeto")
      .leftJoinAndSelect("projeto.criador", "criador")
      .leftJoinAndSelect("projeto.membros", "membros")
      .leftJoinAndSelect("membros.usuario", "membroUsuario")
      .where("projeto.criadorId = :userId", { userId })
      .orWhere("membros.usuarioId = :userId", { userId })
      .orderBy("projeto.updatedAt", "DESC")
      .getMany();
  }

  async findOne(id: number, userId: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: [
        "criador",
        "membros",
        "membros.usuario",
        "colunas",
        "tarefas",
        "tarefas.responsavel",
      ],
    });

    if (!projeto) {
      throw new NotFoundException("Projeto não encontrado");
    }

    // Verificar se o usuário tem acesso ao projeto
    if (!projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar este projeto",
      );
    }

    return projeto;
  }

  async update(
    id: number,
    updateProjetoDto: UpdateProjetoDto,
    userId: number,
  ): Promise<Projeto> {
    const projeto = await this.findOne(id, userId);

    // Verificar se o usuário pode editar o projeto
    if (!projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para editar este projeto",
      );
    }

    Object.assign(projeto, updateProjetoDto);
    await this.projetoRepository.save(projeto);

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const projeto = await this.findOne(id, userId);

    // Apenas o criador pode deletar o projeto
    if (!projeto.isOwner(userId)) {
      throw new ForbiddenException("Apenas o criador pode deletar o projeto");
    }

    await this.projetoRepository.remove(projeto);
  }

  async addMembro(
    projetoId: number,
    addMembroDto: AddMembroProjetoDto,
    userId: number,
  ): Promise<MembroProjeto> {
    const projeto = await this.findOne(projetoId, userId);

    // Verificar se o usuário pode gerenciar membros
    const userMember = projeto.membros?.find((m) => m.usuarioId === userId);
    if (
      !projeto.isOwner(userId) &&
      (!userMember || !userMember.canManageMembers())
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para adicionar membros",
      );
    }

    // Verificar se o usuário a ser adicionado existe
    const usuario = await this.userRepository.findOne({
      where: { id: addMembroDto.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // Verificar se o usuário já é membro
    const membroExistente = await this.membroProjetoRepository.findOne({
      where: { projetoId, usuarioId: addMembroDto.usuarioId },
    });

    if (membroExistente) {
      throw new BadRequestException("Usuário já é membro deste projeto");
    }

    // Criar o membro
    const membro = this.membroProjetoRepository.create({
      projetoId,
      usuarioId: addMembroDto.usuarioId,
      papel: addMembroDto.papel,
    });

    return this.membroProjetoRepository.save(membro);
  }

  async updateMembro(
    projetoId: number,
    membroId: number,
    updateMembroDto: UpdateMembroProjetoDto,
    userId: number,
  ): Promise<MembroProjeto> {
    const projeto = await this.findOne(projetoId, userId);

    // Verificar se o usuário pode gerenciar membros
    const userMember = projeto.membros?.find((m) => m.usuarioId === userId);
    if (
      !projeto.isOwner(userId) &&
      (!userMember || !userMember.canManageMembers())
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para alterar membros",
      );
    }

    const membro = await this.membroProjetoRepository.findOne({
      where: { id: membroId, projetoId },
      relations: ["usuario"],
    });

    if (!membro) {
      throw new NotFoundException("Membro não encontrado");
    }

    // Não permitir alterar o próprio papel se for o único admin
    if (membro.usuarioId === userId && membro.papel === PapelMembro.ADMIN) {
      const adminCount =
        projeto.membros?.filter((m) => m.papel === PapelMembro.ADMIN).length ||
        0;
      if (adminCount <= 1 && updateMembroDto.papel !== PapelMembro.ADMIN) {
        throw new BadRequestException(
          "Deve haver pelo menos um administrador no projeto",
        );
      }
    }

    Object.assign(membro, updateMembroDto);
    return this.membroProjetoRepository.save(membro);
  }

  async removeMembro(
    projetoId: number,
    membroId: number,
    userId: number,
  ): Promise<void> {
    const projeto = await this.findOne(projetoId, userId);

    // Verificar se o usuário pode gerenciar membros
    const userMember = projeto.membros?.find((m) => m.usuarioId === userId);
    if (
      !projeto.isOwner(userId) &&
      (!userMember || !userMember.canManageMembers())
    ) {
      throw new ForbiddenException(
        "Você não tem permissão para remover membros",
      );
    }

    const membro = await this.membroProjetoRepository.findOne({
      where: { id: membroId, projetoId },
    });

    if (!membro) {
      throw new NotFoundException("Membro não encontrado");
    }

    await this.membroProjetoRepository.remove(membro);
  }

  private async createDefaultColumns(projetoId: number): Promise<void> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
    });
    if (!projeto) {
      throw new NotFoundException(
        `Projeto com ID ${projetoId} não encontrado.`,
      );
    }

    const defaultColumns = [
      { nome: "A Fazer", cor: "#6B7280", ordem: 1 },
      { nome: "Em Progresso", cor: "#3B82F6", ordem: 2 },
      { nome: "Em Revisão", cor: "#F59E0B", ordem: 3 },
      { nome: "Concluído", cor: "#10B981", ordem: 4 },
    ];

    for (const coluna of defaultColumns) {
      const newColuna = this.colunaRepository.create({
        projeto,
        ...coluna,
      });
      await this.colunaRepository.save(newColuna);
    }
  }

  async getProjetoStats(projetoId: number, userId: number) {
    const projeto = await this.findOne(projetoId, userId);

    const stats = {
      totalTarefas: projeto.tarefas?.length || 0,
      tarefasConcluidas: 0,
      tarefasEmAndamento: 0,
      tarefasAtrasadas: 0,
      membrosAtivos: projeto.membros?.length || 0,
    };

    if (projeto.tarefas) {
      const hoje = new Date();
      projeto.tarefas.forEach((tarefa) => {
        if (tarefa.coluna?.nome === "Concluído") {
          stats.tarefasConcluidas++;
        } else {
          stats.tarefasEmAndamento++;
          if (tarefa.prazo && new Date(tarefa.prazo) < hoje) {
            stats.tarefasAtrasadas++;
          }
        }
      });
    }

    return stats;
  }
}
