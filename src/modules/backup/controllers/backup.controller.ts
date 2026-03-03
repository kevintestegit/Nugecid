import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { BackupService } from "../services/backup.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";

@ApiTags("backup")
@ApiBearerAuth()
@Controller("backup")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post("full")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cria um backup completo do banco de dados" })
  @ApiResponse({
    status: 200,
    description: "Backup criado com sucesso",
  })
  @ApiResponse({
    status: 500,
    description: "Erro ao criar backup",
  })
  async createFullBackup() {
    return await this.backupService.createFullBackup();
  }

  @Post("desarquivamentos")
  @Roles("admin", "coordenador")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cria um backup da tabela de desarquivamentos",
  })
  @ApiResponse({
    status: 200,
    description: "Backup de desarquivamentos criado com sucesso",
  })
  async createDesarquivamentoBackup() {
    return await this.backupService.createDesarquivamentoBackup();
  }

  @Get("list")
  @Roles("admin", "coordenador")
  @ApiOperation({ summary: "Lista todos os backups disponíveis" })
  @ApiResponse({
    status: 200,
    description: "Lista de backups",
  })
  async listBackups() {
    const backups = await this.backupService.listBackups();
    return {
      total: backups.length,
      backups,
    };
  }

  @Post("restore/:filename")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Restaura um backup específico (USE COM CUIDADO!)" })
  @ApiResponse({
    status: 200,
    description: "Backup restaurado com sucesso",
  })
  @ApiResponse({
    status: 404,
    description: "Backup não encontrado",
  })
  async restoreBackup(@Param("filename") filename: string) {
    if (!this.backupService.isHttpRestoreEnabled()) {
      throw new ForbiddenException(
        "Restore via HTTP está desabilitado neste ambiente.",
      );
    }

    return await this.backupService.restoreBackup(filename);
  }

  @Post("clean")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove backups antigos" })
  @ApiResponse({
    status: 200,
    description: "Backups antigos removidos",
  })
  async cleanOldBackups() {
    const deletedCount = await this.backupService.cleanOldBackups();
    return {
      success: true,
      deletedCount,
      message: `${deletedCount} arquivo(s) removido(s)`,
    };
  }
}
