import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import * as multer from "multer";
import { PastasService } from "./pastas.service";
import { CreatePastaDto } from "./dto/create-pasta.dto";
import { UpdatePastaDto } from "./dto/update-pasta.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleType } from "../users/enums/role-type.enum";

@Controller("pastas")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PastasController {
  constructor(private readonly pastasService: PastasService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "imagens", maxCount: 20 },
        { name: "planilha", maxCount: 5 },
      ],
      { storage: multer.memoryStorage() },
    ),
  )
  create(
    @Body() createPastaDto: CreatePastaDto,
    @UploadedFiles() files: any,
    @Request() req: any,
  ) {
    return this.pastasService.create(createPastaDto, files, req.user?.id);
  }

  @Get()
  findAll(@Request() req: any) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.findAll(isAdmin ? undefined : user?.id);
  }

  @Get("itens")
  buscarItens(
    @Query("q") query: string,
    @Query("limit") limit?: string,
    @Request() req?: any,
  ) {
    const user = req?.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const safeLimit =
      parsedLimit !== undefined && !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : undefined;

    return this.pastasService.buscarItens(query, safeLimit, isAdmin ? undefined : user?.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.findOne(id, isAdmin ? undefined : user?.id);
  }

  @Patch(":id")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  update(
    @Param("id") id: string,
    @Body() updatePastaDto: UpdatePastaDto,
    @Request() req: any,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.update(id, updatePastaDto, isAdmin ? undefined : user?.id);
  }

  @Post(":id/arquivos")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "imagens", maxCount: 20 },
        { name: "planilha", maxCount: 5 },
      ],
      { storage: multer.memoryStorage() },
    ),
  )
  adicionarArquivos(
    @Param("id") id: string,
    @UploadedFiles() files: any,
    @Request() req: any,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.adicionarArquivos(id, files, isAdmin ? undefined : user?.id);
  }

  @Get(":id/arquivos")
  listarArquivos(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.listarArquivos(id, isAdmin ? undefined : user?.id);
  }

  @Get(":id/itens")
  listarItens(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.listarItens(id, isAdmin ? undefined : user?.id);
  }

  @Get(":id/arquivos/:arquivoId/download")
  async downloadArquivo(
    @Param("id") id: string,
    @Param("arquivoId") arquivoId: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    const arquivo = await this.pastasService.obterArquivo(
      id,
      arquivoId,
      isAdmin ? undefined : user?.id,
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(arquivo.nome)}"`,
    );
    return res.sendFile(arquivo.caminhoAbsoluto);
  }

  @Delete(":id/arquivos/:arquivoId")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  removerArquivo(
    @Param("id") id: string,
    @Param("arquivoId") arquivoId: string,
    @Request() req: any,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.removerArquivo(id, arquivoId, isAdmin ? undefined : user?.id);
  }

  @Delete(":id")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  remove(@Param("id") id: string, @Request() req: any) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.remove(id, isAdmin ? undefined : user?.id);
  }
}
