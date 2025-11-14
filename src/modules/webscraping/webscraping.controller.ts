import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebscrapingService } from './services/webscraping.service';
import { BuscarSeirnDto, SeirnProcessoDto, SeirnOcorrenciaDto } from './dto/seirn.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Webscraping SEIRN')
@Controller('webscraping/seirn')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebscrapingController {
  constructor(private readonly webscrapingService: WebscrapingService) {}

  @Get('processo/:numero')
  @ApiOperation({ summary: 'Buscar processo no SEIRN' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Processo encontrado',
    type: SeirnProcessoDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Processo não encontrado' })
  async buscarProcesso(
    @Param('numero') numero: string,
    @Query('use_cache') useCache: boolean = true,
  ) {
    return await this.webscrapingService.buscarProcesso(numero, useCache);
  }

  @Get('ocorrencia/:numero')
  @ApiOperation({ summary: 'Buscar ocorrência no SEIRN' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ocorrência encontrada',
    type: SeirnOcorrenciaDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ocorrência não encontrada' })
  async buscarOcorrencia(
    @Param('numero') numero: string,
    @Query('use_cache') useCache: boolean = true,
  ) {
    return await this.webscrapingService.buscarOcorrencia(numero, useCache);
  }

  @Post('buscar')
  @ApiOperation({ summary: 'Busca genérica no SEIRN' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Busca realizada com sucesso' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' })
  async buscarGenerico(@Body() dto: BuscarSeirnDto) {
    return await this.webscrapingService.buscarGenerico(dto);
  }

  @Delete('cache')
  @ApiOperation({ summary: 'Limpar cache do webscraping' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache limpo com sucesso' })
  async limparCache(@Query('tipo') tipo?: string) {
    return await this.webscrapingService.limparCache(tipo);
  }

  @Get('cache/status')
  @ApiOperation({ summary: 'Status do cache Redis' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status do cache' })
  async cacheStatus() {
    return await this.webscrapingService.verificarCacheStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check do serviço de webscraping' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Serviço disponível' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Serviço indisponível' })
  async healthCheck() {
    return await this.webscrapingService.healthCheck();
  }
}
