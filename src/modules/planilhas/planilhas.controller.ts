import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleType } from "../users/enums/role-type.enum";
import { PlanilhasService } from "./planilhas.service";

@Controller("planilhas")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanilhasController {
  constructor(private readonly planilhasService: PlanilhasService) {}

  @Get()
  findAll() {
    return this.planilhasService.findAll();
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
