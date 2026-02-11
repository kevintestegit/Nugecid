import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, TableColumn } from "typeorm";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import { DesarquivamentoAnexoTypeOrmEntity } from "./infrastructure/entities/desarquivamento-anexo.typeorm-entity";
import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import { User } from "../users/entities/user.entity";
import { FileValidator } from "../../common/utils/file-validator";

@Injectable()
export class NugecidAnexosService implements OnModuleInit {
  private readonly logger = new Logger(NugecidAnexosService.name);
  private readonly uploadPath = path.join(
    process.cwd(),
    "uploads",
    "desarquivamentos",
  );

  constructor(
    @InjectRepository(DesarquivamentoAnexoTypeOrmEntity)
    private readonly anexoRepository: Repository<DesarquivamentoAnexoTypeOrmEntity>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    // Criar diretório de uploads se não existir (async)
    if (!existsSync(this.uploadPath)) {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
    await this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const hasTable = await queryRunner.hasTable("desarquivamento_anexos");
      if (!hasTable) {
        return;
      }

      const hasDescricao = await queryRunner.hasColumn(
        "desarquivamento_anexos",
        "descricao",
      );
      if (!hasDescricao) {
        this.logger.warn(
          'Coluna "descricao" n�o encontrada em desarquivamento_anexos. Criando coluna automaticamente.',
        );
        await queryRunner.addColumn(
          "desarquivamento_anexos",
          new TableColumn({
            name: "descricao",
            type: "text",
            isNullable: true,
          }),
        );
      }
    } catch (error) {
      this.logger.error(
        "Falha ao garantir esquema da tabela desarquivamento_anexos",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await queryRunner.release();
    }
  }

  async uploadAnexo(
    desarquivamentoId: number,
    file: Express.Multer.File,
    user: User,
    descricao?: string,
    tipoAnexo: "desarquivamento" | "rearquivamento" = "desarquivamento",
    anexarAoProcesso: boolean = false,
  ): Promise<any> {
    // Verificar se o desarquivamento existe
    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where: { id: desarquivamentoId },
    });

    if (!desarquivamento) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    // Validar tipo de arquivo (tamanho e MIME type básico)
    this.validateFile(file);

    // Validar conteúdo real do arquivo por magic bytes
    await FileValidator.validateImageOrDocument(file.buffer);

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, uniqueFileName);

    // Salvar arquivo no sistema de arquivos (async)
    try {
      await fs.writeFile(filePath, file.buffer);
    } catch (error) {
      this.logger.error("Erro ao salvar arquivo:", error);
      throw new BadRequestException("Erro ao salvar o arquivo");
    }

    // Criar registro no banco
    const anexo = this.anexoRepository.create({
      desarquivamentoId: anexarAoProcesso ? null : desarquivamentoId,
      numeroProcesso: anexarAoProcesso ? desarquivamento.numeroProcesso : null,
      usuarioId: user.id,
      nomeOriginal: file.originalname,
      nomeArquivo: uniqueFileName,
      caminhoArquivo: filePath,
      tipoMime: file.mimetype,
      tamanhoBytes: file.size,
      descricao: descricao || null,
      tipoAnexo,
    });

    const savedAnexo = await this.anexoRepository.save(anexo);

    const tipoVinculo = anexarAoProcesso ? "processo" : "solicitação";
    this.logger.log(
      `Anexo criado: ${savedAnexo.nomeOriginal} para ${tipoVinculo} ${anexarAoProcesso ? desarquivamento.numeroProcesso : desarquivamentoId} por ${user.usuario}`,
    );

    return this.mapAnexoResponse(savedAnexo);
  }

  private mapAnexoResponse(anexo: DesarquivamentoAnexoTypeOrmEntity) {
    const base = {
      id: anexo.id,
      desarquivamentoId: anexo.desarquivamentoId,
      numeroProcesso: anexo.numeroProcesso,
      usuarioId: anexo.usuarioId,
      nomeOriginal: anexo.nomeOriginal,
      nomeArquivo: anexo.nomeArquivo,
      caminhoArquivo: anexo.caminhoArquivo,
      tipoMime: anexo.tipoMime,
      tamanhoBytes: anexo.tamanhoBytes,
      descricao: anexo.descricao,
      tipoAnexo: anexo.tipoAnexo,
      tipoVinculo: anexo.getTipoVinculo(),
      createdAt: anexo.createdAt,
      usuario: anexo.usuario,
    };

    // Usar a rota da API para visualização, que já tem controle de acesso
    const routeBase = anexo.desarquivamentoId
      ? `/api/nugecid/${anexo.desarquivamentoId}/anexos/${anexo.id}`
      : `/api/nugecid/processo/${encodeURIComponent(anexo.numeroProcesso)}/anexos/${anexo.id}`;

    const previewUrl =
      anexo.isImage() || anexo.isPdf() ? `${routeBase}/view` : undefined;

    return {
      ...base,
      url: `${routeBase}/download`,
      previewUrl,
    };
  }

  async findAnexosByDesarquivamento(
    desarquivamentoId: number,
    tipoAnexo?: "desarquivamento" | "rearquivamento",
  ): Promise<any[]> {
    // Buscar o desarquivamento para pegar o numeroProcesso
    const desarquivamento = await this.desarquivamentoRepository.findOne({
      where: { id: desarquivamentoId },
    });

    if (!desarquivamento) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    const where: any[] = [];

    // Anexos da solicitação específica
    const whereSolicitacao: any = { desarquivamentoId };
    if (tipoAnexo) {
      whereSolicitacao.tipoAnexo = tipoAnexo;
    }
    where.push(whereSolicitacao);

    // Anexos do processo (se houver numeroProcesso)
    if (desarquivamento.numeroProcesso) {
      const whereProcesso: any = {
        numeroProcesso: desarquivamento.numeroProcesso,
      };
      if (tipoAnexo) {
        whereProcesso.tipoAnexo = tipoAnexo;
      }
      where.push(whereProcesso);
    }

    const anexos = await this.anexoRepository.find({
      where,
      order: { createdAt: "DESC" },
    });

    return anexos.map((anexo) => this.mapAnexoResponse(anexo));
  }

  /**
   * Busca anexos de um processo (todas as solicitações)
   */
  async findAnexosByProcesso(
    numeroProcesso: string,
    tipoAnexo?: "desarquivamento" | "rearquivamento",
  ): Promise<any[]> {
    const where: any = { numeroProcesso };
    if (tipoAnexo) {
      where.tipoAnexo = tipoAnexo;
    }

    const anexos = await this.anexoRepository.find({
      where,
      order: { createdAt: "DESC" },
    });

    return anexos.map((anexo) => this.mapAnexoResponse(anexo));
  }

  async findAnexoById(id: number): Promise<DesarquivamentoAnexoTypeOrmEntity> {
    const anexo = await this.anexoRepository.findOne({
      where: { id },
      relations: ["usuario"],
    });

    if (!anexo) {
      throw new NotFoundException("Anexo não encontrado");
    }

    return anexo;
  }

  async downloadAnexo(
    id: number,
  ): Promise<{ buffer: Buffer; anexo: DesarquivamentoAnexoTypeOrmEntity }> {
    const anexo = await this.findAnexoById(id);

    // Verificar se o arquivo existe
    if (!existsSync(anexo.caminhoArquivo)) {
      throw new NotFoundException(
        "Arquivo não encontrado no sistema de arquivos",
      );
    }

    try {
      const buffer = await fs.readFile(anexo.caminhoArquivo);
      return { buffer, anexo };
    } catch (error) {
      this.logger.error("Erro ao ler arquivo:", error);
      throw new BadRequestException("Erro ao ler o arquivo");
    }
  }

  async deleteAnexo(id: number, user: User): Promise<void> {
    const anexo = await this.findAnexoById(id);

    // Verificar permissões (apenas o dono ou admin pode deletar)
    if (!user.isAdmin() && anexo.usuarioId !== user.id) {
      throw new BadRequestException(
        "Você não tem permissão para deletar este anexo",
      );
    }

    // Remover arquivo do sistema de arquivos (async)
    try {
      if (existsSync(anexo.caminhoArquivo)) {
        await fs.unlink(anexo.caminhoArquivo);
      }
    } catch (error) {
      this.logger.error("Erro ao remover arquivo:", error);
      // Não lançar erro aqui, continuar com a remoção do registro
    }

    // Remover registro do banco
    await this.anexoRepository.remove(anexo);

    this.logger.log(
      `Anexo removido: ${anexo.nomeOriginal} por ${user.usuario}`,
    );
  }

  async updateAnexoDescricao(
    id: number,
    descricao: string,
    user: User,
  ): Promise<any> {
    const anexo = await this.findAnexoById(id);

    // Verificar permissões (apenas o dono ou admin/coordenador pode editar)
    if (
      !user.isAdmin() &&
      !user.isCoordenador() &&
      anexo.usuarioId !== user.id
    ) {
      throw new BadRequestException(
        "Você não tem permissão para editar este anexo",
      );
    }

    anexo.descricao = descricao;
    const updatedAnexo = await this.anexoRepository.save(anexo);

    this.logger.log(
      `Descrição de anexo atualizada: ${anexo.nomeOriginal} por ${user.usuario}`,
    );

    return this.mapAnexoResponse(updatedAnexo);
  }

  private validateFile(file: Express.Multer.File): void {
    // Verificar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        "Arquivo muito grande. Tamanho máximo: 10MB",
      );
    }

    // Verificar tipos permitidos
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Tipo de arquivo não permitido. Tipos aceitos: imagens, PDF, documentos Word/Excel e arquivos de texto.",
      );
    }
  }
}
