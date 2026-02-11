import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vestigio } from "./entities/vestigio.entity";
import { CreateVestigioDto } from "./dto/create-vestigio.dto";
import { UpdateVestigioDto } from "./dto/update-vestigio.dto";

@Injectable()
export class VestigiosService {
  constructor(
    @InjectRepository(Vestigio)
    private readonly vestigioRepository: Repository<Vestigio>,
  ) {}

  async create(
    createVestigioDto: CreateVestigioDto,
    userId?: number,
  ): Promise<Vestigio> {
    const vestigio = this.vestigioRepository.create({
      ...createVestigioDto,
      criadoPorId: userId,
    });

    return await this.vestigioRepository.save(vestigio);
  }

  async findAll(filters?: {
    status?: string;
    delegacia?: string;
    categoria?: string;
    mesReferencia?: string;
  }): Promise<Vestigio[]> {
    const query = this.vestigioRepository
      .createQueryBuilder("vestigio")
      .leftJoinAndSelect("vestigio.criadoPor", "criadoPor");

    if (filters?.status) {
      query.andWhere("vestigio.status = :status", { status: filters.status });
    }

    if (filters?.delegacia) {
      query.andWhere("vestigio.delegacia = :delegacia", {
        delegacia: filters.delegacia,
      });
    }

    if (filters?.categoria) {
      query.andWhere("vestigio.categoria = :categoria", {
        categoria: filters.categoria,
      });
    }

    if (filters?.mesReferencia) {
      query.andWhere("vestigio.mesReferencia = :mesReferencia", {
        mesReferencia: filters.mesReferencia,
      });
    }

    query.orderBy("vestigio.createdAt", "DESC");

    return await query.getMany();
  }

  async findOne(id: string): Promise<Vestigio> {
    const vestigio = await this.vestigioRepository.findOne({
      where: { id },
      relations: ["criadoPor"],
    });

    if (!vestigio) {
      throw new NotFoundException(`Vestígio com ID ${id} não encontrado`);
    }

    return vestigio;
  }

  async update(
    id: string,
    updateVestigioDto: UpdateVestigioDto,
  ): Promise<Vestigio> {
    const vestigio = await this.findOne(id);

    Object.assign(vestigio, updateVestigioDto);

    return await this.vestigioRepository.save(vestigio);
  }

  async remove(id: string): Promise<void> {
    const vestigio = await this.findOne(id);
    await this.vestigioRepository.remove(vestigio);
  }

  async updateStatus(id: string, status: string): Promise<Vestigio> {
    const vestigio = await this.findOne(id);
    vestigio.status = status;
    return await this.vestigioRepository.save(vestigio);
  }

  async searchByCodigoScv(codigoScv: string): Promise<Vestigio[]> {
    return await this.vestigioRepository
      .createQueryBuilder("vestigio")
      .where("vestigio.codigoScv LIKE :codigo", { codigo: `%${codigoScv}%` })
      .leftJoinAndSelect("vestigio.criadoPor", "criadoPor")
      .orderBy("vestigio.createdAt", "DESC")
      .getMany();
  }

  async getStatistics(): Promise<{
    total: number;
    porStatus: Record<string, number>;
    porCategoria: Record<string, number>;
    porDelegacia: Record<string, number>;
  }> {
    const vestigios = await this.vestigioRepository.find();

    const porStatus: Record<string, number> = {};
    const porCategoria: Record<string, number> = {};
    const porDelegacia: Record<string, number> = {};

    vestigios.forEach((v) => {
      porStatus[v.status] = (porStatus[v.status] || 0) + 1;
      if (v.categoria) {
        porCategoria[v.categoria] = (porCategoria[v.categoria] || 0) + 1;
      }
      if (v.delegacia) {
        porDelegacia[v.delegacia] = (porDelegacia[v.delegacia] || 0) + 1;
      }
    });

    return {
      total: vestigios.length,
      porStatus,
      porCategoria,
      porDelegacia,
    };
  }
}
