import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checklist } from '../entities/checklist.entity';
import { ItemChecklist } from '../entities/item-checklist.entity';
import { Tarefa } from '../entities/tarefa.entity';
import { CreateChecklistDto, CreateItemChecklistDto, UpdateItemChecklistDto } from '../dto';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepo: Repository<Checklist>,
    @InjectRepository(ItemChecklist)
    private readonly itemChecklistRepo: Repository<ItemChecklist>,
    @InjectRepository(Tarefa)
    private readonly tarefaRepo: Repository<Tarefa>,
  ) {}

  async create(tarefaId: number, createDto: CreateChecklistDto): Promise<Checklist> {
    const tarefa = await this.tarefaRepo.findOne({ where: { id: tarefaId } });
    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    const checklist = this.checklistRepo.create({
      ...createDto,
      tarefaId,
    });

    return this.checklistRepo.save(checklist);
  }

  async findAllByTask(tarefaId: number): Promise<Checklist[]> {
    return this.checklistRepo.find({
      where: { tarefaId },
      relations: ['itens', 'itens.concluidoPor'],
      order: {
        createdAt: 'ASC',
        itens: {
          ordem: 'ASC',
        },
      },
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.checklistRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Checklist não encontrado');
    }
  }

  async addItem(checklistId: number, createDto: CreateItemChecklistDto): Promise<ItemChecklist> {
    const checklist = await this.checklistRepo.findOne({ 
      where: { id: checklistId },
      relations: ['itens']
    });
    
    if (!checklist) {
      throw new NotFoundException('Checklist não encontrado');
    }

    const ordem = checklist.getNextOrdem();

    const item = this.itemChecklistRepo.create({
      ...createDto,
      checklistId,
      ordem,
      concluido: false,
    });

    return this.itemChecklistRepo.save(item);
  }

  async updateItem(itemId: number, updateDto: UpdateItemChecklistDto, userId: number): Promise<ItemChecklist> {
    const item = await this.itemChecklistRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    if (updateDto.texto !== undefined) {
      item.texto = updateDto.texto;
    }

    if (updateDto.concluido !== undefined) {
      if (updateDto.concluido) {
        item.markAsCompleted(userId);
      } else {
        item.markAsIncomplete();
      }
    }

    return this.itemChecklistRepo.save(item);
  }

  async removeItem(itemId: number): Promise<void> {
    const result = await this.itemChecklistRepo.delete(itemId);
    if (result.affected === 0) {
      throw new NotFoundException('Item não encontrado');
    }
  }
}
