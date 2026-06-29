import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vestigio } from "./entities/vestigio.entity";
import { CreateVestigioDto } from "./dto/create-vestigio.dto";
import { UpdateVestigioDto } from "./dto/update-vestigio.dto";

const VESTIGIO_STATUS_CATALOGACAO_PENDENTE = "catalogacao_pendente";
const VESTIGIO_STATUS_CATALOGADO = "catalogado";
const VALID_VESTIGIO_STATUSES = [
  "catalogacao_pendente",
  "catalogado",
  "em_analise",
  "finalizado",
];

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
      status: createVestigioDto.status ?? VESTIGIO_STATUS_CATALOGACAO_PENDENTE,
      criadoPorId: userId,
    });

    return await this.vestigioRepository.save(vestigio);
  }

  async findAll(filters?: {
    status?: string;
    delegacia?: string;
    categoria?: string;
    mesReferencia?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Vestigio[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

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

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId?: number): Promise<Vestigio> {
    const vestigio = await this.vestigioRepository.findOne({
      where: { id },
      relations: ["criadoPor"],
    });

    if (!vestigio) {
      throw new NotFoundException(`Vestígio com ID ${id} não encontrado`);
    }

    this.ensureOwnership(vestigio, userId);

    return vestigio;
  }

  async update(
    id: string,
    updateVestigioDto: UpdateVestigioDto,
    userId: number,
  ): Promise<Vestigio> {
    const vestigio = await this.findOne(id, userId);

    Object.assign(vestigio, updateVestigioDto);

    if (this.hasCatalogacaoMetadata(updateVestigioDto)) {
      vestigio.status = updateVestigioDto.status ?? VESTIGIO_STATUS_CATALOGADO;
    }

    return await this.vestigioRepository.save(vestigio);
  }

  private hasCatalogacaoMetadata(
    updateVestigioDto: UpdateVestigioDto,
  ): boolean {
    return Boolean(
      updateVestigioDto.metadadosGerais ||
        updateVestigioDto.metadadosEspecificos,
    );
  }

  async remove(id: string, userId: number): Promise<void> {
    const vestigio = await this.findOne(id, userId);
    await this.vestigioRepository.remove(vestigio);
  }

  async clearCatalogacaoPendente(): Promise<{ deletedCount: number }> {
    const result = await this.vestigioRepository.delete({
      status: VESTIGIO_STATUS_CATALOGACAO_PENDENTE,
    });

    return { deletedCount: result.affected ?? 0 };
  }

  async updateStatus(
    id: string,
    status: string,
    userId: number,
  ): Promise<Vestigio> {
    this.validateStatus(status);
    const vestigio = await this.findOne(id, userId);
    vestigio.status = status;
    return await this.vestigioRepository.save(vestigio);
  }

  async searchByCodigoScv(codigoScv: string): Promise<Vestigio[]> {
    return await this.vestigioRepository
      .createQueryBuilder("vestigio")
      .where("vestigio.codigoScv LIKE :codigo", { codigo: `%${codigoScv}%` })
      .leftJoinAndSelect("vestigio.criadoPor", "criadoPor")
      .orderBy("vestigio.createdAt", "DESC")
      .take(50)
      .getMany();
  }

  async getStatistics(): Promise<{
    total: number;
    porStatus: Record<string, number>;
    porCategoria: Record<string, number>;
    porDelegacia: Record<string, number>;
  }> {
    const [statusRows, categoriaRows, delegaciaRows] = await Promise.all([
      this.vestigioRepository
        .createQueryBuilder("v")
        .select("v.status", "key")
        .addSelect("COUNT(v.id)", "count")
        .groupBy("v.status")
        .getRawMany(),
      this.vestigioRepository
        .createQueryBuilder("v")
        .select("v.categoria", "key")
        .addSelect("COUNT(v.id)", "count")
        .where("v.categoria IS NOT NULL")
        .groupBy("v.categoria")
        .getRawMany(),
      this.vestigioRepository
        .createQueryBuilder("v")
        .select("v.delegacia", "key")
        .addSelect("COUNT(v.id)", "count")
        .where("v.delegacia IS NOT NULL")
        .groupBy("v.delegacia")
        .getRawMany(),
    ]);

    const toRecord = (
      rows: { key: string; count: string }[],
    ): Record<string, number> =>
      rows.reduce(
        (acc, r) => ({ ...acc, [r.key]: Number(r.count) }),
        {} as Record<string, number>,
      );

    const porStatus = toRecord(statusRows);
    const total = Object.values(porStatus).reduce((sum, n) => sum + n, 0);

    return {
      total,
      porStatus,
      porCategoria: toRecord(categoriaRows),
      porDelegacia: toRecord(delegaciaRows),
    };
  }

  private ensureOwnership(vestigio: Vestigio, userId?: number): void {
    if (userId !== undefined && vestigio.criadoPorId !== userId) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar este vestígio",
      );
    }
  }

  private validateStatus(status: string): void {
    if (!VALID_VESTIGIO_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Status inválido. Valores permitidos: ${VALID_VESTIGIO_STATUSES.join(", ")}`,
      );
    }
  }
}
