import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
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

import { SecurityService, BlockIpDto } from "./security.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";

@ApiTags("Segurança")
@Controller("security")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get("ip-access-stats")
  @Roles("admin")
  @ApiOperation({ summary: "Obtém estatísticas de acesso por IP" })
  @ApiResponse({ status: 200, description: "Estatísticas obtidas" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async getIpAccessStats(
    @Query("days") days: string = "7",
    @Query("limit") limit: string = "100",
  ) {
    const stats = await this.securityService.getIpAccessStats(
      parseInt(days),
      parseInt(limit),
    );

    return {
      success: true,
      data: stats,
      meta: {
        days: parseInt(days),
        limit: parseInt(limit),
        total: stats.length,
      },
    };
  }

  @Get("ip-access-details/:ipAddress")
  @Roles("admin")
  @ApiOperation({ summary: "Obtém detalhes de acesso de um IP específico" })
  @ApiResponse({ status: 200, description: "Detalhes obtidos" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async getIpAccessDetails(
    @Param("ipAddress") ipAddress: string,
    @Query("days") days: string = "30",
  ) {
    const details = await this.securityService.getIpAccessDetails(
      ipAddress,
      parseInt(days),
    );

    return {
      success: true,
      data: details,
      meta: {
        ipAddress,
        days: parseInt(days),
        total: details.length,
      },
    };
  }

  @Get("blocked-ips")
  @Roles("admin")
  @ApiOperation({ summary: "Lista IPs bloqueados" })
  @ApiResponse({ status: 200, description: "Lista de IPs bloqueados" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async listBlockedIps(
    @Query("includeInactive") includeInactive: string = "false",
  ) {
    const blockedIps = await this.securityService.listBlockedIps(
      includeInactive === "true",
    );

    return {
      success: true,
      data: blockedIps,
      meta: {
        total: blockedIps.length,
        includeInactive: includeInactive === "true",
      },
    };
  }

  @Post("blocked-ips")
  @Roles("admin")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Bloqueia um IP" })
  @ApiResponse({ status: 201, description: "IP bloqueado com sucesso" })
  @ApiResponse({ status: 400, description: "IP já está bloqueado" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async blockIp(
    @Body() body: { ipAddress: string; reason?: string; expiresAt?: string },
    @CurrentUser() user: User,
  ) {
    const dto: BlockIpDto = {
      ipAddress: body.ipAddress,
      reason: body.reason,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      blockedBy: user.id,
    };

    const blocked = await this.securityService.blockIp(dto);

    return {
      success: true,
      data: blocked,
      message: `IP ${body.ipAddress} bloqueado com sucesso`,
    };
  }

  @Delete("blocked-ips/:ipAddress")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Desbloqueia um IP" })
  @ApiResponse({ status: 200, description: "IP desbloqueado com sucesso" })
  @ApiResponse({ status: 404, description: "IP não encontrado" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async unblockIp(@Param("ipAddress") ipAddress: string) {
    const unblocked = await this.securityService.unblockIp(ipAddress);

    return {
      success: true,
      data: unblocked,
      message: `IP ${ipAddress} desbloqueado com sucesso`,
    };
  }

  @Post("auto-block")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Executa auto-bloqueio de IPs suspeitos" })
  @ApiResponse({ status: 200, description: "Auto-bloqueio executado" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async autoBlockSuspiciousIps(
    @Body()
    body: {
      failedAttemptsThreshold?: number;
      timeWindowMinutes?: number;
      blockDurationHours?: number;
    } = {},
  ) {
    const blockedIps = await this.securityService.autoBlockSuspiciousIps(
      body.failedAttemptsThreshold || 10,
      body.timeWindowMinutes || 30,
      body.blockDurationHours || 24,
    );

    return {
      success: true,
      data: blockedIps,
      message: `Auto-bloqueio executado: ${blockedIps.length} IPs bloqueados`,
      meta: {
        blocked: blockedIps.length,
      },
    };
  }

  @Get("blocked-users")
  @Roles("admin")
  @ApiOperation({ summary: "Lista usuários bloqueados" })
  @ApiResponse({ status: 200, description: "Lista de usuários bloqueados" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async listBlockedUsers() {
    const blockedUsers = await this.securityService.listBlockedUsers();

    return {
      success: true,
      data: blockedUsers,
      meta: {
        total: blockedUsers.length,
      },
    };
  }

  @Delete("blocked-users/:userId")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Desbloqueia um usuário" })
  @ApiResponse({ status: 200, description: "Usuário desbloqueado com sucesso" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  @ApiResponse({ status: 400, description: "Usuário não está bloqueado" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async unblockUser(@Param("userId") userId: string) {
    const user = await this.securityService.unblockUser(parseInt(userId, 10));

    return {
      success: true,
      data: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
      },
      message: `Usuário ${user.usuario} desbloqueado com sucesso`,
    };
  }
}
