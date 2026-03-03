import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import * as multer from "multer";
import { extname } from "path";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleType } from "../users/enums/role-type.enum";
import { PlanilhasService } from "./planilhas.service";

const ALLOWED_PLANILHA_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
]);

const ALLOWED_PLANILHA_EXTENSIONS = new Set([".xlsx", ".xls", ".csv"]);

const planilhaFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const extension = extname(file.originalname || "").toLowerCase();
  if (
    !ALLOWED_PLANILHA_EXTENSIONS.has(extension) ||
    !ALLOWED_PLANILHA_MIME_TYPES.has(file.mimetype)
  ) {
    cb(new Error("Arquivo inválido. Envie uma planilha .xlsx, .xls ou .csv."));
    return;
  }
  cb(null, true);
};

@Controller("planilhas")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanilhasController {
  constructor(private readonly planilhasService: PlanilhasService) {}

  @Get()
  findAll(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.planilhasService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("geral")
  obterPlanilhaGeral() {
    return this.planilhasService.obterPlanilhaGeral();
  }

  @Post()
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("planilha", {
      storage: multer.memoryStorage(),
      fileFilter: planilhaFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  create(@UploadedFile() file: Express.Multer.File) {
    return this.planilhasService.create(file);
  }

  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const { registro, caminhoAbsoluto } =
      await this.planilhasService.obterArquivo(id);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(registro.nomeOriginal)}"`,
    );

    return res.sendFile(caminhoAbsoluto);
  }

  @Delete(":id")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    await this.planilhasService.remove(id);
    return;
  }
}
