import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
  Request,
} from "@nestjs/common";
import { PastasService } from "./pastas.service";
import { CreatePastaDto } from "./dto/create-pasta.dto";
import { UpdatePastaDto } from "./dto/update-pasta.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import * as multer from "multer";

@Controller("pastas")
export class PastasController {
  constructor(private readonly pastasService: PastasService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "imagens", maxCount: 20 },
        { name: "planilha", maxCount: 5 },
      ],
      {
        storage: multer.memoryStorage(),
      },
    ),
  )
  create(
    @Body() createPastaDto: CreatePastaDto,
    @UploadedFiles()
    files: {
      imagens?: Express.Multer.File[];
      planilha?: Express.Multer.File[];
    },
    @Request() req: any,
  ) {
    return this.pastasService.create(createPastaDto, files, req.user?.id);
  }

  @Get()
  findAll() {
    return this.pastasService.findAll();
  }

  @Get("itens")
  buscarItens(@Query("q") query?: string, @Query("limit") limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const safeLimit =
      parsedLimit !== undefined && !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : undefined;

    return this.pastasService.buscarItens(query, safeLimit);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.pastasService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updatePastaDto: UpdatePastaDto) {
    return this.pastasService.update(id, updatePastaDto);
  }

  @Post(":id/arquivos")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "imagens", maxCount: 20 },
        { name: "planilha", maxCount: 5 },
      ],
      {
        storage: multer.memoryStorage(),
      },
    ),
  )
  adicionarArquivos(
    @Param("id") id: string,
    @UploadedFiles()
    files: {
      imagens?: Express.Multer.File[];
      planilha?: Express.Multer.File[];
    },
  ) {
    return this.pastasService.adicionarArquivos(id, files);
  }

  @Get(":id/arquivos")
  listarArquivos(@Param("id") id: string) {
    return this.pastasService.listarArquivos(id);
  }

  @Get(":id/itens")
  listarItens(@Param("id") id: string) {
    return this.pastasService.listarItens(id);
  }

  @Get(":id/arquivos/:arquivoId/download")
  async downloadArquivo(
    @Param("id") id: string,
    @Param("arquivoId") arquivoId: string,
    @Res() res: Response,
  ) {
    const arquivo = await this.pastasService.obterArquivo(id, arquivoId);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(arquivo.nome)}"`,
    );
    return res.sendFile(arquivo.caminhoAbsoluto);
  }

  @Delete(":id/arquivos/:arquivoId")
  removerArquivo(
    @Param("id") id: string,
    @Param("arquivoId") arquivoId: string,
  ) {
    return this.pastasService.removerArquivo(id, arquivoId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.pastasService.remove(id);
  }
}
