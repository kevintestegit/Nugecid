import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SystemSettingsService } from "../services/system-settings.service";
import { UpdateSystemSettingsDto } from "../dto/update-system-settings.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";

@ApiTags("system-settings")
@ApiBearerAuth()
@Controller("system-settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @Roles("admin", "coordenador")
  @ApiOperation({ summary: "Busca configurações do sistema" })
  @ApiResponse({
    status: 200,
    description: "Configurações do sistema",
  })
  async getSettings() {
    const settings = await this.systemSettingsService.getSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Put()
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Atualiza configurações do sistema" })
  @ApiResponse({
    status: 200,
    description: "Configurações atualizadas com sucesso",
  })
  async updateSettings(@Body() updateDto: UpdateSystemSettingsDto) {
    const settings = await this.systemSettingsService.updateSettings(updateDto);
    return {
      success: true,
      data: settings,
      message: "Configurações atualizadas com sucesso",
    };
  }

  @Post("reset")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reseta configurações para valores padrão" })
  @ApiResponse({
    status: 200,
    description: "Configurações resetadas para valores padrão",
  })
  async resetToDefaults() {
    const settings = await this.systemSettingsService.resetToDefaults();
    return {
      success: true,
      data: settings,
      message: "Configurações resetadas para valores padrão",
    };
  }
}
