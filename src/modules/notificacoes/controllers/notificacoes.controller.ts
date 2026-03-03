import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Headers,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Sse,
  MessageEvent,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { Observable, interval, map, merge, from } from "rxjs";
import { finalize } from "rxjs/operators";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request";
import {
  NotificacoesService,
  NotificacoesSchedulerService,
  NotificationPreferencesService,
  PushNotificationsService,
  CreateNotificacaoDto,
  QueryNotificacoesDto,
} from "../services";
import {
  RemovePushSubscriptionDto,
  SavePushSubscriptionDto,
  UpdateNotificationPreferencesDto,
} from "../dto";
import {
  Notificacao,
  TipoNotificacao,
  PrioridadeNotificacao,
} from "../entities";

@ApiTags("notificacoes")
@Controller("notificacoes")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificacoesController {
  constructor(
    private readonly notificacoesService: NotificacoesService,
    private readonly notificacoesSchedulerService: NotificacoesSchedulerService,
    private readonly notificationPreferencesService: NotificationPreferencesService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar uma nova notificação" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Notificação criada com sucesso",
    type: Notificacao,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Usuário ou solicitação não encontrados",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async create(
    @Body() createNotificacaoDto: CreateNotificacaoDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Notificacao> {
    // Por padrão, criar notificação para o usuário logado
    const notificacaoData = {
      ...createNotificacaoDto,
      usuarioId: createNotificacaoDto.usuarioId || req.user.id,
    };
    return this.notificacoesService.create(notificacaoData);
  }

  @Get()
  @ApiOperation({ summary: "Listar notificações do usuário logado" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Número da página",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Itens por página",
  })
  @ApiQuery({
    name: "lida",
    required: false,
    type: Boolean,
    description: "Filtrar por status de leitura",
  })
  @ApiQuery({
    name: "tipo",
    required: false,
    enum: TipoNotificacao,
    description: "Filtrar por tipo",
  })
  @ApiQuery({
    name: "prioridade",
    required: false,
    enum: PrioridadeNotificacao,
    description: "Filtrar por prioridade",
  })
  @ApiQuery({
    name: "cursorCreatedAt",
    required: false,
    type: String,
    description:
      "Cursor de paginação por data (ISO-8601). Quando informado, usa keyset pagination.",
  })
  @ApiQuery({
    name: "cursorId",
    required: false,
    type: Number,
    description:
      "Cursor de desempate por ID (usar junto com cursorCreatedAt para keyset).",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de notificações retornada com sucesso",
    type: [Notificacao],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findAll(
    @Query() queryDto: QueryNotificacoesDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    data: Notificacao[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    nextCursor?: {
      createdAt: string;
      id: number;
    };
  }> {
    return this.notificacoesService.findByUsuario(req.user.id, queryDto);
  }

  @Get("estatisticas")
  @ApiOperation({ summary: "Obter estatísticas de notificações do usuário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Estatísticas retornadas com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async getEstatisticas(@Request() req: AuthenticatedRequest) {
    return this.notificacoesService.getEstatisticas(req.user.id);
  }

  @Get("nao-lidas")
  @ApiOperation({ summary: "Listar apenas notificações não lidas" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notificações não lidas retornadas com sucesso",
    type: [Notificacao],
  })
  async getNaoLidas(@Request() req: AuthenticatedRequest): Promise<{
    data: Notificacao[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    nextCursor?: {
      createdAt: string;
      id: number;
    };
  }> {
    return this.notificacoesService.findByUsuario(req.user.id, { lida: false });
  }

  @Sse("stream")
  @ApiExcludeEndpoint()
  streamNotificacoes(@Request() req: AuthenticatedRequest): Observable<MessageEvent> {
    const userId = Number(req.user.id);

    // 1) Emit all current unread notifications as "init" event
    const init$ = from(
      this.notificacoesService.findByUsuario(userId, {
        lida: false,
        limit: 50,
      }),
    ).pipe(
      map(
        (result) =>
          ({
            type: "init",
            data: {
              notificacoes: result.data,
              total: result.total,
              timestamp: new Date().toISOString(),
            },
          }) as MessageEvent,
      ),
    );

    // 2) Stream individual new notifications in real-time via Subject
    const realtime$ = this.notificacoesService.getUserStream(userId).pipe(
      map(
        (notificacao) =>
          ({
            type: "nova-notificacao",
            data: {
              notificacao,
              timestamp: new Date().toISOString(),
            },
          }) as MessageEvent,
      ),
    );

    // 3) Heartbeat every 30s to keep the connection alive
    const heartbeat$ = interval(30000).pipe(
      map(
        () =>
          ({
            type: "heartbeat",
            data: { timestamp: new Date().toISOString() },
          }) as MessageEvent,
      ),
    );

    // Merge all streams; clean up user subject when SSE connection closes
    return merge(init$, realtime$, heartbeat$).pipe(
      finalize(() => {
        this.notificacoesService.removeUserStream(userId);
      }),
    );
  }

  // ========== ENDPOINTS DE PREFERÊNCIAS DE NOTIFICAÇÃO ==========

  @Get("preferences")
  @ApiOperation({ summary: "Obter preferências de notificação do usuário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Preferências retornadas com sucesso",
  })
  async getPreferences(@Request() req: AuthenticatedRequest) {
    const preferences =
      await this.notificationPreferencesService.getPreferences(req.user.id);

    return {
      success: true,
      data: preferences,
    };
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Atualizar preferências de notificação do usuário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Preferências atualizadas com sucesso",
  })
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    const preferences =
      await this.notificationPreferencesService.updatePreferences(
        req.user.id,
        updateDto,
      );

    return {
      success: true,
      data: preferences,
      message: "Preferências atualizadas com sucesso",
    };
  }

  @Post("preferences/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resetar preferências para valores padrão" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Preferências resetadas com sucesso",
  })
  async resetPreferences(@Request() req: AuthenticatedRequest) {
    const preferences =
      await this.notificationPreferencesService.resetToDefaults(req.user.id);

    return {
      success: true,
      data: preferences,
      message: "Preferências resetadas para valores padrão",
    };
  }

  @Get("push/config")
  @ApiOperation({ summary: "Obter configuração pública de Web Push" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Configuração pública retornada com sucesso",
  })
  getPushConfig() {
    return {
      success: true,
      data: this.pushNotificationsService.getClientConfig(),
    };
  }

  @Post("push/subscriptions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Registrar ou atualizar subscription Web Push" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Subscription registrada com sucesso",
  })
  async savePushSubscription(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SavePushSubscriptionDto,
    @Headers("user-agent") userAgent?: string,
  ) {
    const subscription = await this.pushNotificationsService.saveSubscription(
      req.user.id,
      dto,
      userAgent,
    );

    return {
      success: true,
      data: subscription,
    };
  }

  @Delete("push/subscriptions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remover subscription Web Push do dispositivo atual",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Subscription removida com sucesso",
  })
  async removePushSubscription(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RemovePushSubscriptionDto,
  ) {
    await this.pushNotificationsService.removeSubscription(req.user.id, dto);

    return {
      success: true,
      message: "Subscription removida com sucesso",
    };
  }

  @Post("teste")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Disparar uma notificação de teste para validar o canal do usuário logado",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notificação de teste enviada com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Preferências atuais impedem o envio do teste",
  })
  async sendTestNotification(@Request() req: AuthenticatedRequest) {
    const preferences =
      await this.notificationPreferencesService.getPreferences(req.user.id);

    if (
      !preferences.inAppEnabled &&
      !preferences.desktopEnabled &&
      !preferences.pushEnabled
    ) {
      throw new BadRequestException(
        "Ative pelo menos um canal de notificação antes de testar.",
      );
    }

    const enabledNotificationType = Object.values(TipoNotificacao).find(
      (type) => preferences.enabledTypes?.[type],
    );

    if (!enabledNotificationType) {
      throw new BadRequestException(
        "Ative pelo menos um tipo de notificação antes de testar.",
      );
    }

    const notification = await this.notificacoesService.create({
      usuarioId: req.user.id,
      tipo: enabledNotificationType,
      prioridade: PrioridadeNotificacao.BAIXA,
      titulo: "Notificação de teste",
      descricao:
        "Se este alerta apareceu, o canal de notificações da área de trabalho está funcionando.",
      detalhes: {
        teste: true,
        origem: "configuracoes",
        disparadoEm: new Date().toISOString(),
      },
      link: "/configuracoes",
    });

    if (!notification) {
      throw new BadRequestException(
        "As preferências atuais bloquearam a notificação de teste.",
      );
    }

    return {
      success: true,
      data: notification,
      message: "Notificação de teste enviada com sucesso",
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar uma notificação específica" })
  @ApiParam({ name: "id", description: "ID da notificação", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notificação encontrada com sucesso",
    type: Notificacao,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notificação não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Notificacao> {
    return this.notificacoesService.findOne(id, req.user.id);
  }

  @Patch(":id/marcar-lida")
  @ApiOperation({ summary: "Marcar notificação como lida" })
  @ApiParam({ name: "id", description: "ID da notificação", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notificação marcada como lida com sucesso",
    type: Notificacao,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notificação não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async marcarComoLida(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Notificacao> {
    return this.notificacoesService.marcarComoLida(id, req.user.id);
  }

  @Patch(":id/marcar-nao-lida")
  @ApiOperation({ summary: "Marcar notificação como não lida" })
  @ApiParam({ name: "id", description: "ID da notificação", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notificação marcada como não lida com sucesso",
    type: Notificacao,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notificação não encontrada",
  })
  async marcarComoNaoLida(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Notificacao> {
    return this.notificacoesService.marcarComoNaoLida(id, req.user.id);
  }

  @Patch("marcar-todas-lidas")
  @ApiOperation({ summary: "Marcar todas as notificações como lidas" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Todas as notificações foram marcadas como lidas",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async marcarTodasComoLidas(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ affected: number }> {
    const affected = await this.notificacoesService.marcarTodasComoLidas(
      req.user.id,
    );
    return { affected };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Excluir notificação" })
  @ApiParam({ name: "id", description: "ID da notificação", type: "number" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Notificação excluída com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Notificação não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.notificacoesService.delete(id, req.user.id);
  }

  // Endpoints específicos para tipos de notificação
  @Post("solicitacao-pendente")
  @ApiOperation({ summary: "Criar notificação de solicitação pendente" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Notificação de solicitação pendente criada com sucesso",
    type: Notificacao,
  })
  async criarSolicitacaoPendente(
    @Body()
    body: { solicitacaoId: number; diasPendentes: number; usuarioId?: number },
    @Request() req: AuthenticatedRequest,
  ): Promise<Notificacao> {
    const usuarioId = body.usuarioId || req.user.id;
    return this.notificacoesService.criarNotificacaoSolicitacaoPendente(
      usuarioId,
      body.solicitacaoId,
      body.diasPendentes,
    );
  }

  @Post("novo-processo")
  @ApiOperation({ summary: "Criar notificação de novo processo SEIRN" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Notificação de novo processo criada com sucesso",
    type: Notificacao,
  })
  async criarNovoProcesso(
    @Body()
    body: { processoId: number; numeroProcesso: string; usuarioId?: number },
    @Request() req: AuthenticatedRequest,
  ): Promise<Notificacao> {
    const usuarioId = body.usuarioId || req.user.id;
    return this.notificacoesService.criarNotificacaoNovoProcesso(
      usuarioId,
      body.processoId,
      body.numeroProcesso,
    );
  }

  @Post("verificar-pendentes")
  @ApiOperation({
    summary: "Verificar e criar notificações para solicitações pendentes",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Verificação concluída e notificações criadas",
  })
  async verificarSolicitacoesPendentes(): Promise<{
    notificacoesCriadas: number;
  }> {
    return this.notificacoesSchedulerService.forcarVerificacao();
  }

  // ========== NOVOS ENDPOINTS PARA TAREFAS ==========

  @Post("verificar-prazos")
  @ApiOperation({
    summary: "Verificar e notificar tarefas com prazo próximo",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Verificação de prazos concluída",
  })
  async verificarPrazos(): Promise<{
    notificacoesCriadas: number;
  }> {
    const notificacoes =
      await this.notificacoesService.verificarTarefasComPrazoProximo();
    return { notificacoesCriadas: notificacoes.length };
  }

  @Post("verificar-atrasadas")
  @ApiOperation({
    summary: "Verificar e notificar tarefas atrasadas",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Verificação de tarefas atrasadas concluída",
  })
  async verificarAtrasadas(): Promise<{
    notificacoesCriadas: number;
  }> {
    const notificacoes =
      await this.notificacoesService.verificarTarefasAtrasadas();
    return { notificacoesCriadas: notificacoes.length };
  }
}
