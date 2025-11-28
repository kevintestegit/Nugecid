import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Res,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { NugecidAnexosService } from "../nugecid-anexos.service";
import { DesarquivamentoAnexoTypeOrmEntity } from "../infrastructure/entities/desarquivamento-anexo.typeorm-entity";

@ApiTags("Anexos de Desarquivamentos")
@Controller("nugecid/:desarquivamentoId/anexos")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnexosController {
  constructor(private readonly anexosService: NugecidAnexosService) {}

  @Post("upload")
  @ApiOperation({ summary: "Fazer upload de anexo para desarquivamento" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Arquivo para upload",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Arquivo a ser anexado",
        },
        descricao: {
          type: "string",
          description: "Descrição ou título do anexo (opcional)",
        },
        tipoAnexo: {
          type: "string",
          enum: ["desarquivamento", "rearquivamento"],
          description: "Tipo do anexo (padrão: desarquivamento)",
          default: "desarquivamento",
        },
        anexarAoProcesso: {
          type: "boolean",
          description:
            "Se true, anexa ao processo (todas solicitações). Se false, anexa apenas a esta solicitação",
          default: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Anexo criado com sucesso",
    type: DesarquivamentoAnexoTypeOrmEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Arquivo inválido ou erro no upload",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Desarquivamento não encontrado",
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadAnexo(
    @Param("desarquivamentoId", ParseIntPipe) desarquivamentoId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body("descricao") descricao: string | undefined,
    @Body("tipoAnexo")
    tipoAnexo: "desarquivamento" | "rearquivamento" = "desarquivamento",
    @Body("anexarAoProcesso") anexarAoProcesso: string | boolean = false,
    @Request() req: any,
  ): Promise<{ success: boolean; data: any }> {
    // Converter string "true"/"false" para boolean
    const anexarProcesso =
      anexarAoProcesso === true || anexarAoProcesso === "true";

    const anexo = await this.anexosService.uploadAnexo(
      desarquivamentoId,
      file,
      req.user,
      descricao,
      tipoAnexo || "desarquivamento",
      anexarProcesso,
    );
    return {
      success: true,
      data: anexo,
    };
  }

  @Get()
  @ApiOperation({ summary: "Listar anexos de um desarquivamento" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de anexos retornada com sucesso",
    type: [DesarquivamentoAnexoTypeOrmEntity],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Desarquivamento não encontrado",
  })
  async findAnexosByDesarquivamento(
    @Param("desarquivamentoId", ParseIntPipe) desarquivamentoId: number,
    @Query("tipo") tipo?: "desarquivamento" | "rearquivamento",
  ): Promise<{ success: boolean; data: any[] }> {
    const anexos = await this.anexosService.findAnexosByDesarquivamento(
      desarquivamentoId,
      tipo,
    );
    return {
      success: true,
      data: anexos,
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar descrição de um anexo" })
  @ApiBody({
    description: "Nova descrição do anexo",
    schema: {
      type: "object",
      properties: {
        descricao: {
          type: "string",
          description: "Descrição ou título do anexo",
          example: "Laudo pericial anexado",
        },
      },
      required: ["descricao"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Descrição atualizada com sucesso",
    type: DesarquivamentoAnexoTypeOrmEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Anexo não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para editar o anexo",
  })
  async updateAnexoDescricao(
    @Param("id", ParseIntPipe) id: number,
    @Param("desarquivamentoId", ParseIntPipe) desarquivamentoId: number,
    @Body("descricao") descricao: string,
    @Request() req: any,
  ): Promise<{ success: boolean; data: any }> {
    const anexo = await this.anexosService.updateAnexoDescricao(
      id,
      descricao,
      req.user,
    );
    return {
      success: true,
      data: anexo,
    };
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Fazer download de um anexo" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Arquivo retornado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Anexo não encontrado",
  })
  async downloadAnexo(
    @Param("id", ParseIntPipe) id: number,
    @Param("desarquivamentoId", ParseIntPipe) desarquivamentoId: number,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, anexo } = await this.anexosService.downloadAnexo(id);

    res.setHeader("Content-Type", anexo.tipoMime);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${anexo.nomeOriginal}"`,
    );
    res.setHeader("Content-Length", anexo.tamanhoBytes.toString());

    res.send(buffer);
  }

  @Get(":id/view")
  @ApiOperation({ summary: "Visualizar um anexo (para imagens e PDFs)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Arquivo retornado para visualização",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Anexo não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Tipo de arquivo não suportado para visualização",
  })
  async viewAnexo(
    @Param("id", ParseIntPipe) id: number,
    @Param("desarquivamentoId", ParseIntPipe) desarquivamentoId: number,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, anexo } = await this.anexosService.downloadAnexo(id);

    // Verificar se é um tipo suportado para visualização inline
    if (!anexo.canPreview()) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "Este tipo de arquivo não pode ser visualizado inline. Use o download.",
      });
      return;
    }

    res.setHeader("Content-Type", anexo.tipoMime);
    res.setHeader("Content-Length", anexo.tamanhoBytes.toString());
    // Para visualização inline, não usar Content-Disposition attachment

    res.send(buffer);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remover anexo" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Anexo removido com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Anexo não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para remover o anexo",
  })
  async deleteAnexo(
    @Param("id", ParseIntPipe) id: number,
    @Param("desarquivamentoId", ParseIntPipe) desarquivamentoId: number,
    @Request() req: any,
  ): Promise<void> {
    return this.anexosService.deleteAnexo(id, req.user);
  }
}

// Controller adicional para anexos de processo
@ApiTags("Anexos de Processo")
@Controller("nugecid/processo/:numeroProcesso/anexos")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnexosProcessoController {
  constructor(private readonly anexosService: NugecidAnexosService) {}

  @Get()
  @ApiOperation({ summary: "Listar anexos de um processo" })
  @ApiParam({
    name: "numeroProcesso",
    description: "Número do processo",
    example: "2024.001.123456",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de anexos do processo retornada com sucesso",
    type: [DesarquivamentoAnexoTypeOrmEntity],
  })
  async findAnexosByProcesso(
    @Param("numeroProcesso") numeroProcesso: string,
    @Query("tipo") tipo?: "desarquivamento" | "rearquivamento",
  ): Promise<{ success: boolean; data: any[] }> {
    const anexos = await this.anexosService.findAnexosByProcesso(
      numeroProcesso,
      tipo,
    );
    return {
      success: true,
      data: anexos,
    };
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Fazer download de um anexo do processo" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Arquivo retornado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Anexo não encontrado",
  })
  async downloadAnexo(
    @Param("id", ParseIntPipe) id: number,
    @Param("numeroProcesso") numeroProcesso: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, anexo } = await this.anexosService.downloadAnexo(id);

    res.setHeader("Content-Type", anexo.tipoMime);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${anexo.nomeOriginal}"`,
    );
    res.setHeader("Content-Length", anexo.tamanhoBytes.toString());

    res.send(buffer);
  }

  @Get(":id/view")
  @ApiOperation({
    summary: "Visualizar um anexo do processo (para imagens e PDFs)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Arquivo retornado para visualização",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Anexo não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Tipo de arquivo não suportado para visualização",
  })
  async viewAnexo(
    @Param("id", ParseIntPipe) id: number,
    @Param("numeroProcesso") numeroProcesso: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, anexo } = await this.anexosService.downloadAnexo(id);

    if (!anexo.canPreview()) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message:
          "Este tipo de arquivo não pode ser visualizado inline. Use o download.",
      });
      return;
    }

    res.setHeader("Content-Type", anexo.tipoMime);
    res.setHeader("Content-Length", anexo.tamanhoBytes.toString());

    res.send(buffer);
  }
}
