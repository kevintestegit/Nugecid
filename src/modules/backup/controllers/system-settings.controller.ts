import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemSettingsService } from '../services/system-settings.service';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('system-settings')
@ApiBearerAuth()
@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Busca configurações do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Configurações do sistema',
  })
  async getSettings() {
    return await this.systemSettingsService.getSettings();
  }

  @Put()
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza configurações do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
  })
  async updateSettings(@Body() updateDto: UpdateSystemSettingsDto) {
    return await this.systemSettingsService.updateSettings(updateDto);
  }

  @Post('reset')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reseta configurações para valores padrão' })
  @ApiResponse({
    status: 200,
    description: 'Configurações resetadas para valores padrão',
  })
  async resetToDefaults() {
    return await this.systemSettingsService.resetToDefaults();
  }
}
