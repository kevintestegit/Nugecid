import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { extname } from "path";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { RoleType } from "../users/enums/role-type.enum";
import { QuerySeiCapturasDto } from "./dto/query-sei-capturas.dto";
import { SeiCapturaService } from "./sei-captura.service";

const ALLOWED_SEI_IMPORT_EXTENSIONS = new Set([".xlsx", ".csv"]);
const ALLOWED_SEI_IMPORT_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
  "text/plain",
]);

@Controller("sei/capturas")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.COORDENADOR)
export class SeiController {
  constructor(private readonly seiCapturaService: SeiCapturaService) {}

  @Post("importar-planilha")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("arquivo", {
      storage: multer.memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const extension = extname(file.originalname || "").toLowerCase();
        if (
          !ALLOWED_SEI_IMPORT_EXTENSIONS.has(extension) ||
          !ALLOWED_SEI_IMPORT_MIME_TYPES.has(file.mimetype)
        ) {
          cb(
            new BadRequestException(
              "Arquivo invalido. Envie exportacao do SEI em .xlsx ou .csv.",
            ),
            false,
          );
          return;
        }

        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  importarPlanilha(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser("id") userId?: number,
  ) {
    return this.seiCapturaService.importarPlanilha(file, userId ?? null);
  }

  @Get()
  listar(@Query() query: QuerySeiCapturasDto) {
    return this.seiCapturaService.listar(query);
  }

  @Post(":id/aprovar")
  @HttpCode(HttpStatus.OK)
  aprovar(@Param("id") id: string, @CurrentUser("id") userId?: number) {
    if (!userId) {
      throw new BadRequestException("Usuario autenticado nao identificado.");
    }

    return this.seiCapturaService.aprovar(id, userId);
  }
}
