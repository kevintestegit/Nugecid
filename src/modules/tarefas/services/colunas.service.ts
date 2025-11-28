import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Coluna, Projeto } from "../entities";
import { CreateColunaDto, UpdateColunaDto } from "../dto";

@Injectable()
export class ColunasService {
  constructor(
    @InjectRepository(Coluna)
    private readonly colunaRepository: Repository<Coluna>,
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
  ) {}

  async create(
    createColunaDto: CreateColunaDto,
    userId: number,
  ): Promise<Coluna> {
    // Verificar se o projeto existe e se o usuário tem acesso
    const projeto = await this.projetoRepository.findOne({
      where: { id: createColunaDto.projetoId },
      relations: ["membros"],
    });

    if (!projeto) {
      throw new NotFoundException("Projeto não encontrado");
    }

    if (!projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para criar colunas neste projeto",
      );
    }

    // Se não foi especificada uma ordem, colocar no final
    if (!createColunaDto.ordem) {
      const lastColuna = await this.colunaRepository.findOne({
        where: { projetoId: createColunaDto.projetoId },
        order: { ordem: "DESC" },
      });
      createColunaDto.ordem = lastColuna ? lastColuna.ordem + 1 : 1;
    } else {
      // Reordenar colunas existentes se necessário
      await this.reorderColumns(
        createColunaDto.projetoId,
        createColunaDto.ordem,
        "insert",
      );
    }

    const coluna = this.colunaRepository.create(createColunaDto);
    return this.colunaRepository.save(coluna);
  }

  async findAll(projetoId: number, userId: number): Promise<Coluna[]> {
    // Buscar projeto e colunas em paralelo
    const [projeto, colunas] = await Promise.all([
      this.projetoRepository.findOne({
        where: { id: projetoId },
        relations: ["membros"],
      }),
      this.colunaRepository.find({
        where: { projetoId },
        relations: ["tarefas", "tarefas.responsavel"],
        order: { ordem: "ASC" },
      }),
    ]);

    if (!projeto) {
      throw new NotFoundException("Projeto não encontrado");
    }

    if (!projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar este projeto",
      );
    }

    return colunas;
  }

  async findOne(id: number, userId: number): Promise<Coluna> {
    const coluna = await this.colunaRepository.findOne({
      where: { id },
      relations: [
        "projeto",
        "projeto.membros",
        "tarefas",
        "tarefas.responsavel",
      ],
    });

    if (!coluna) {
      throw new NotFoundException("Coluna não encontrada");
    }

    if (!coluna.projeto.canUserView(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar esta coluna",
      );
    }

    return coluna;
  }

  async update(
    id: number,
    updateColunaDto: UpdateColunaDto,
    userId: number,
  ): Promise<Coluna> {
    const coluna = await this.findOne(id, userId);

    if (!coluna.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para editar esta coluna",
      );
    }

    // Se a ordem foi alterada, reordenar
    if (updateColunaDto.ordem && updateColunaDto.ordem !== coluna.ordem) {
      await this.reorderColumns(
        coluna.projetoId,
        updateColunaDto.ordem,
        "update",
        coluna.ordem,
      );
    }

    Object.assign(coluna, updateColunaDto);
    return this.colunaRepository.save(coluna);
  }

  async remove(id: number, userId: number): Promise<void> {
    const coluna = await this.findOne(id, userId);

    if (!coluna.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para deletar esta coluna",
      );
    }

    // Verificar se a coluna tem tarefas
    if (coluna.tarefas && coluna.tarefas.length > 0) {
      throw new BadRequestException(
        "Não é possível deletar uma coluna que contém tarefas",
      );
    }

    // Reordenar colunas após remoção
    await this.reorderColumns(coluna.projetoId, coluna.ordem, "delete");

    await this.colunaRepository.remove(coluna);
  }

  async reorderColumns(
    projetoId: number,
    targetOrder: number,
    operation: "insert" | "update" | "delete",
    currentOrder?: number,
  ): Promise<void> {
    const colunas = await this.colunaRepository.find({
      where: { projetoId },
      order: { ordem: "ASC" },
    });

    switch (operation) {
      case "insert":
        // Incrementar ordem das colunas que estão na posição target ou depois
        for (const coluna of colunas) {
          if (coluna.ordem >= targetOrder) {
            coluna.ordem += 1;
            await this.colunaRepository.save(coluna);
          }
        }
        break;

      case "update":
        if (!currentOrder) return;

        if (targetOrder > currentOrder) {
          // Movendo para frente: decrementar colunas entre current e target
          for (const coluna of colunas) {
            if (coluna.ordem > currentOrder && coluna.ordem <= targetOrder) {
              coluna.ordem -= 1;
              await this.colunaRepository.save(coluna);
            }
          }
        } else {
          // Movendo para trás: incrementar colunas entre target e current
          for (const coluna of colunas) {
            if (coluna.ordem >= targetOrder && coluna.ordem < currentOrder) {
              coluna.ordem += 1;
              await this.colunaRepository.save(coluna);
            }
          }
        }
        break;

      case "delete":
        // Decrementar ordem das colunas que estão depois da deletada
        for (const coluna of colunas) {
          if (coluna.ordem > targetOrder) {
            coluna.ordem -= 1;
            await this.colunaRepository.save(coluna);
          }
        }
        break;
    }
  }

  async moveColumn(
    id: number,
    newOrder: number,
    userId: number,
  ): Promise<Coluna> {
    const coluna = await this.findOne(id, userId);

    if (!coluna.projeto.canUserEdit(userId)) {
      throw new ForbiddenException(
        "Você não tem permissão para reordenar colunas neste projeto",
      );
    }

    const maxOrder = await this.colunaRepository.count({
      where: { projetoId: coluna.projetoId },
    });

    if (newOrder < 1 || newOrder > maxOrder) {
      throw new BadRequestException(`Ordem deve estar entre 1 e ${maxOrder}`);
    }

    if (newOrder === coluna.ordem) {
      return coluna;
    }

    await this.reorderColumns(
      coluna.projetoId,
      newOrder,
      "update",
      coluna.ordem,
    );

    coluna.ordem = newOrder;
    return this.colunaRepository.save(coluna);
  }

  async getColunaStats(id: number, userId: number) {
    const coluna = await this.findOne(id, userId);

    const stats = {
      totalTarefas: coluna.tarefas?.length || 0,
      tarefasAtrasadas: 0,
      tarefasPorPrioridade: {
        baixa: 0,
        media: 0,
        alta: 0,
        critica: 0,
      },
    };

    if (coluna.tarefas) {
      const hoje = new Date();
      coluna.tarefas.forEach((tarefa) => {
        if (tarefa.prazo && new Date(tarefa.prazo) < hoje) {
          stats.tarefasAtrasadas++;
        }

        if (tarefa.prioridade) {
          stats.tarefasPorPrioridade[tarefa.prioridade]++;
        }
      });
    }

    return stats;
  }
}
