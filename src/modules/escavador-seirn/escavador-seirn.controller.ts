import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Headers,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EscavadorSeirnService } from "./escavador-seirn.service";
import { StartEscavadorDto } from "./dto/start-escavador.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { HookEscavadorDto } from "./dto/hook-escavador.dto";
import { IsPublic } from "../../common/decorators/is-public.decorator";

@ApiTags("escavador-seirn")
@ApiBearerAuth()
@Controller("escavador-seirn")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscavadorSeirnController {
  constructor(private readonly escavadorService: EscavadorSeirnService) {}

  @Get("status")
  @Roles("admin", "coordenador")
  @ApiOperation({ summary: "Status do escavador SEIRN" })
  async status() {
    return this.escavadorService.getStatus();
  }

  @Post("start")
  @Roles("admin", "coordenador")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Inicia o escavador SEIRN" })
  @ApiResponse({ status: 200, description: "Escavador iniciado" })
  async start(@Body() dto: StartEscavadorDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.escavadorService.start(dto, userId);
  }

  @Post("stop")
  @Roles("admin", "coordenador")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Encerra o escavador SEIRN" })
  @ApiResponse({ status: 200, description: "Escavador parado" })
  async stop() {
    await this.escavadorService.stop();
    return { running: false };
  }

  @Post("hook")
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Webhook para registrar novo processo detectado externamente",
  })
  @ApiResponse({ status: 200, description: "Notificação registrada" })
  async hook(
    @Body() dto: HookEscavadorDto,
    @Headers("authorization") authorization?: string,
    @Headers("x-escavador-signature") signature?: string,
    @Headers("x-escavador-timestamp") timestamp?: string,
  ) {
    return this.escavadorService.webhook(dto, {
      authorization,
      signature,
      timestamp,
    });
  }
}
