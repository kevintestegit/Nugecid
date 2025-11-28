import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  Not,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
} from "typeorm";
import { SystemAnnouncement, AnnouncementViewed } from "../entities";
import { CreateAnnouncementDto, UpdateAnnouncementDto } from "../dto";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(SystemAnnouncement)
    private readonly announcementRepository: Repository<SystemAnnouncement>,
    @InjectRepository(AnnouncementViewed)
    private readonly viewedRepository: Repository<AnnouncementViewed>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Cria um novo aviso
   */
  async create(
    createDto: CreateAnnouncementDto,
    createdById: number,
  ): Promise<SystemAnnouncement> {
    // Validar datas
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(
        "A data de fim deve ser posterior à data de início",
      );
    }

    const announcement = this.announcementRepository.create({
      ...createDto,
      startDate,
      endDate,
      createdById,
      active: createDto.active ?? true,
    });

    return this.announcementRepository.save(announcement);
  }

  /**
   * Lista todos os avisos (admin)
   */
  async findAll(includeInactive = false): Promise<SystemAnnouncement[]> {
    const queryBuilder = this.announcementRepository
      .createQueryBuilder("announcement")
      .leftJoinAndSelect("announcement.createdBy", "createdBy")
      .orderBy("announcement.startDate", "DESC");

    if (!includeInactive) {
      queryBuilder.andWhere("announcement.active = :active", { active: true });
    }

    return queryBuilder.getMany();
  }

  /**
   * Busca um aviso por ID
   */
  async findOne(id: number): Promise<SystemAnnouncement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ["createdBy"],
    });

    if (!announcement) {
      throw new NotFoundException("Aviso não encontrado");
    }

    return announcement;
  }

  /**
   * Atualiza um aviso
   */
  async update(
    id: number,
    updateDto: UpdateAnnouncementDto,
  ): Promise<SystemAnnouncement> {
    const announcement = await this.findOne(id);

    // Validar datas se fornecidas
    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate
        ? new Date(updateDto.startDate)
        : announcement.startDate;
      const endDate = updateDto.endDate
        ? new Date(updateDto.endDate)
        : announcement.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException(
          "A data de fim deve ser posterior à data de início",
        );
      }

      Object.assign(announcement, {
        ...updateDto,
        startDate,
        endDate,
      });
    } else {
      Object.assign(announcement, updateDto);
    }

    return this.announcementRepository.save(announcement);
  }

  /**
   * Remove um aviso
   */
  async remove(id: number): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementRepository.remove(announcement);
  }

  /**
   * Busca avisos ativos para um usuário específico
   * (não visualizados ainda)
   */
  async findActiveForUser(userId: number): Promise<SystemAnnouncement[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["role"],
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const now = new Date();

    // Buscar avisos ativos no período
    const announcements = await this.announcementRepository
      .createQueryBuilder("announcement")
      .where("announcement.active = :active", { active: true })
      .andWhere("announcement.startDate <= :now", { now })
      .andWhere("announcement.endDate >= :now", { now })
      .orderBy("announcement.priority", "DESC")
      .addOrderBy("announcement.startDate", "DESC")
      .getMany();

    // Filtrar por role e visualizações
    const filteredAnnouncements: SystemAnnouncement[] = [];

    for (const announcement of announcements) {
      // Verificar se deve mostrar para este role
      if (!announcement.shouldShowToUser(user.role.name)) {
        continue;
      }

      // Verificar se já foi visualizado
      const alreadyViewed = await this.viewedRepository.findOne({
        where: {
          announcementId: announcement.id,
          userId,
        },
      });

      if (!alreadyViewed) {
        filteredAnnouncements.push(announcement);
      }
    }

    return filteredAnnouncements;
  }

  /**
   * Marca um aviso como visualizado por um usuário
   */
  async markAsViewed(
    announcementId: number,
    userId: number,
  ): Promise<AnnouncementViewed> {
    // Verificar se aviso existe
    await this.findOne(announcementId);

    // Verificar se já foi visualizado
    const existingView = await this.viewedRepository.findOne({
      where: {
        announcementId,
        userId,
      },
    });

    if (existingView) {
      return existingView;
    }

    const viewed = this.viewedRepository.create({
      announcementId,
      userId,
    });

    return this.viewedRepository.save(viewed);
  }

  /**
   * Busca estatísticas de visualização de um aviso
   */
  async getViewStats(
    announcementId: number,
  ): Promise<{ total: number; viewedBy: AnnouncementViewed[] }> {
    await this.findOne(announcementId);

    const viewedBy = await this.viewedRepository.find({
      where: { announcementId },
      relations: ["user"],
      order: { viewedAt: "DESC" },
    });

    return {
      total: viewedBy.length,
      viewedBy,
    };
  }

  /**
   * Desativa avisos expirados automaticamente
   */
  async deactivateExpired(): Promise<number> {
    const now = new Date();

    const result = await this.announcementRepository.update(
      {
        active: true,
        endDate: LessThanOrEqual(now),
      },
      {
        active: false,
      },
    );

    return result.affected || 0;
  }
}
