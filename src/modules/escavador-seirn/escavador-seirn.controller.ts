import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Headers,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EscavadorSeirnService } from "./escavador-seirn.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { HookEscavadorDto } from "./dto/hook-escavador.dto";
import { IsPublic } from "../../common/decorators/is-public.decorator";

@ApiTags("escavador-seirn")
@ApiBearerAuth()
@Controller("escavador-seirn")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscavadorSeirnController {
  constructor(private readonly escavadorService: EscavadorSeirnService) {}

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
