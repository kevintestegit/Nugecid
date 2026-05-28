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
import { extname, join } from "path";
import { mkdirSync } from "fs";
import { PastasService } from "./pastas.service";
import { CreatePastaDto } from "./dto/create-pasta.dto";
import { UpdatePastaDto } from "./dto/update-pasta.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleType } from "../users/enums/role-type.enum";
import { PastaArquivoTipo } from "./entities/pasta-arquivo.entity";
import { inferContentTypeFromFilename } from "../storage/storage.service";
import { AuthenticatedRequest } from "../../common/types/authenticated-request";

interface PastaUploadedFiles {
  imagens?: Express.Multer.File[];
  planilha?: Express.Multer.File[];
  planilhas?: Express.Multer.File[];
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ALLOWED_SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
]);

const ALLOWED_SPREADSHEET_EXTENSIONS = new Set([".xlsx", ".csv"]);
const PASTAS_TMP_UPLOAD_DIR = join(process.cwd(), "uploads", ".tmp", "pastas");

const pastasFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.fieldname === "imagens") {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Imagem inválida para upload."));
      return;
    }
    cb(null, true);
    return;
  }

  if (file.fieldname === "planilha" || file.fieldname === "planilhas") {
    const extension = extname(file.originalname || "").toLowerCase();
    if (
      !ALLOWED_SPREADSHEET_EXTENSIONS.has(extension) ||
      !ALLOWED_SPREADSHEET_MIME_TYPES.has(file.mimetype)
    ) {
      cb(new Error("Planilha inválida. Envie .xlsx ou .csv."));
      return;
    }
    cb(null, true);
    return;
  }

  cb(new Error("Campo de upload inválido."));
};

const pastasUploadOptions: multer.Options = {
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(PASTAS_TMP_UPLOAD_DIR, { recursive: true });
      cb(null, PASTAS_TMP_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = extname(file.originalname || "").toLowerCase();
      cb(null, `${suffix}${extension}`);
    },
  }),
  fileFilter: pastasFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
};

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
      pastasUploadOptions,
    ),
  )
  create(
    @Body() createPastaDto: CreatePastaDto,
    @UploadedFiles() files: PastaUploadedFiles,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pastasService.create(createPastaDto, files, req.user?.id);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.findAll(isAdmin ? undefined : user?.id);
  }

  @Get("itens")
  buscarItens(
    @Query("q") query: string,
    @Query("limit") limit?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const user = req?.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const safeLimit =
      parsedLimit !== undefined && !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : undefined;

    return this.pastasService.buscarItens(
      query,
      safeLimit,
      isAdmin ? undefined : user?.id,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
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
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.update(
      id,
      updatePastaDto,
      isAdmin ? undefined : user?.id,
    );
  }

  @Post(":id/arquivos")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "imagens", maxCount: 20 },
        { name: "planilha", maxCount: 5 },
      ],
      pastasUploadOptions,
    ),
  )
  adicionarArquivos(
    @Param("id") id: string,
    @UploadedFiles() files: PastaUploadedFiles,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.adicionarArquivos(
      id,
      files,
      isAdmin ? undefined : user?.id,
    );
  }

  @Get(":id/arquivos")
  listarArquivos(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.listarArquivos(
      id,
      isAdmin ? undefined : user?.id,
    );
  }

  @Get(":id/itens")
  listarItens(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
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
    @Request() req: AuthenticatedRequest,
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
      "Content-Type",
      arquivo.contentType || inferContentTypeFromFilename(arquivo.nome),
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(arquivo.nome)}"`,
    );
    res.setHeader("Content-Length", arquivo.size.toString());
    return res.send(arquivo.buffer);
  }

  @Get(":id/arquivos/:arquivoId/view")
  async visualizarArquivo(
    @Param("id") id: string,
    @Param("arquivoId") arquivoId: string,
    @Res() res: Response,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    const arquivo = await this.pastasService.obterArquivo(
      id,
      arquivoId,
      isAdmin ? undefined : user?.id,
    );

    if (arquivo.tipo !== PastaArquivoTipo.IMAGEM) {
      return res.status(400).json({
        message: "Somente imagens podem ser visualizadas inline.",
      });
    }

    res.setHeader(
      "Content-Type",
      arquivo.contentType || inferContentTypeFromFilename(arquivo.nome),
    );
    res.setHeader("Content-Length", arquivo.size.toString());
    return res.send(arquivo.buffer);
  }

  @Delete(":id/arquivos/:arquivoId")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  removerArquivo(
    @Param("id") id: string,
    @Param("arquivoId") arquivoId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.removerArquivo(
      id,
      arquivoId,
      isAdmin ? undefined : user?.id,
    );
  }

  @Delete(":id")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const user = req.user;
    const role = user?.role?.name;
    const isAdmin = role === "admin" || role === "coordenador";
    return this.pastasService.remove(id, isAdmin ? undefined : user?.id);
  }
}
