import { createHmac } from "crypto";
import { ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EscavadorSeirnService } from "./escavador-seirn.service";
import { HookEscavadorDto } from "./dto/hook-escavador.dto";
import { NotificacoesService } from "../notificacoes/services/notificacoes.service";
import { SeiCapturaService } from "../sei/sei-captura.service";
import { TipoNotificacao } from "../notificacoes/entities";

describe("EscavadorSeirnService", () => {
  const mockConfigService = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        ESCAVADOR_WEBHOOK_TOKEN: "segredo-webhook",
        ESCAVADOR_WEBHOOK_TOLERANCE_SECONDS: "300",
      };
      return values[key] ?? fallback;
    }),
  } as unknown as ConfigService;

  const mockNotificacoesService = {
    create: jest.fn().mockResolvedValue({}),
    findLatestByTipo: jest.fn().mockResolvedValue(null),
  } as unknown as NotificacoesService;

  const mockSeiCapturaService = {
    criarFromWebhook: jest.fn().mockResolvedValue({ id: "captura-id" }),
  } as unknown as SeiCapturaService;

  let service: EscavadorSeirnService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EscavadorSeirnService(
      mockConfigService,
      mockNotificacoesService,
      mockSeiCapturaService,
    );
    jest.spyOn(service["logger"], "log").mockImplementation(() => {});
    jest.spyOn(service["logger"], "warn").mockImplementation(() => {});
    jest.spyOn(service["logger"], "error").mockImplementation(() => {});
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    process.env.ESCAVADOR_NOTIFY_USER_ID = "11";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ESCAVADOR_NOTIFY_USER_ID;
    delete process.env.ESCAVADOR_WEBHOOK_ALLOW_LEGACY_TOKEN;
    delete process.env.ESCAVADOR_WEBHOOK_TOKEN;
  });

  const makePayload = () => ({
    numero: "0800123-12.2026.8.20.5001",
    titulo: "Novo processo SEI-RN",
    link: "https://seirn.itep.rn.gov.br/processo/123",
    usuarioId: 11,
  });

  const signPayload = (
    payload: ReturnType<typeof makePayload>,
    timestamp: string,
    secret = "segredo-webhook",
  ) =>
    createHmac("sha256", secret)
      .update(
        [
          "v1",
          timestamp,
          payload.numero,
          payload.titulo,
          payload.link,
          "11",
        ].join("\n"),
      )
      .digest("hex");

  it("aceita webhook com assinatura HMAC válida", async () => {
    const payload = makePayload();
    const timestamp = "1700000000";
    const signature = signPayload(payload, timestamp);

    const result = await service.webhook(
      payload as unknown as HookEscavadorDto,
      {
        timestamp,
        signature,
      },
    );

    expect(result).toEqual({ ok: true, capturaId: "captura-id" });
    expect(mockNotificacoesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 11,
        tipo: TipoNotificacao.NOVO_PROCESSO,
      }),
    );
    expect(mockSeiCapturaService.criarFromWebhook).toHaveBeenCalledWith(
      {
        numero: payload.numero,
        titulo: payload.titulo,
        link: payload.link,
      },
      11,
    );
  });

  it("rejeita webhook com assinatura inválida", async () => {
    await expect(
      service.webhook(makePayload() as unknown as HookEscavadorDto, {
        timestamp: "1700000000",
        signature: "b".repeat(64),
      }),
    ).rejects.toThrow(
      new ForbiddenException("Assinatura inválida para webhook"),
    );
  });

  it("rejeita webhook fora da janela de validade", async () => {
    const payload = makePayload();
    const timestamp = "1699999000";
    const signature = signPayload(payload, timestamp);

    await expect(
      service.webhook(payload as unknown as HookEscavadorDto, {
        timestamp,
        signature,
      }),
    ).rejects.toThrow(
      new ForbiddenException("Webhook fora da janela de validade"),
    );
  });

  it("bloqueia bearer legado por padrão", async () => {
    await expect(
      service.webhook(makePayload() as unknown as HookEscavadorDto, {
        authorization: "Bearer segredo-webhook",
      }),
    ).rejects.toThrow(
      new ForbiddenException("Webhook do escavador não autorizado"),
    );
  });

  it("rejeita bearer legado mesmo quando ESCAVADOR_WEBHOOK_ALLOW_LEGACY_TOKEN=true", async () => {
    process.env.ESCAVADOR_WEBHOOK_ALLOW_LEGACY_TOKEN = "true";

    await expect(
      service.webhook(makePayload() as unknown as HookEscavadorDto, {
        authorization: "Bearer segredo-webhook",
      }),
    ).rejects.toThrow(
      new ForbiddenException("Webhook do escavador não autorizado"),
    );
  });

  it("não expõe controle de processo local", () => {
    const localProcessApi = service as unknown as Record<string, unknown>;

    expect(localProcessApi.start).toBeUndefined();
    expect(localProcessApi.stop).toBeUndefined();
    expect(localProcessApi.getStatus).toBeUndefined();
  });
});
