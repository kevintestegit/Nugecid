import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import * as nodemailer from "nodemailer";
import { MailService } from "./mail.service";

const createMockMailer = () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: "test-1" }),
});

const createConfig = (
  email: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    from?: string;
  },
  adminEmail?: string,
) => ({
  get: jest.fn((key: string) => {
    if (key === "app.email") return email;
    if (key === "ADMIN_EMAIL") return adminEmail;
    return undefined;
  }),
});

describe("MailService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("skipa envio quando EMAIL_HOST nao esta configurado (degrade graceful)", async () => {
    const mailer = createMockMailer();
    const service = new MailService(createConfig({}) as never, mailer as never);
    jest.spyOn(service["logger"], "debug").mockImplementation(() => undefined);

    expect(service.isEnabled()).toBe(false);

    const sent = await service.send("admin@itep.rn.gov.br", "Teste", "Corpo");

    expect(sent).toBe(false);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it("compila via Nest DI sem transporter customizado", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: createConfig({}) },
      ],
    }).compile();

    expect(moduleRef.get(MailService).isEnabled()).toBe(false);
    await moduleRef.close();
  });

  it("cria transporter via Nest DI quando EMAIL_HOST esta configurado", async () => {
    const createTransportSpy = jest
      .spyOn(nodemailer, "createTransport")
      .mockReturnValue(createMockMailer() as never);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: createConfig({ host: "smtp.example.com" }),
        },
      ],
    }).compile();

    expect(moduleRef.get(MailService).isEnabled()).toBe(true);
    expect(createTransportSpy).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: undefined,
    });
    await moduleRef.close();
  });

  it("envia email quando EMAIL_HOST esta configurado", async () => {
    const mailer = createMockMailer();
    const service = new MailService(
      createConfig({
        host: "smtp.example.com",
        port: 587,
        from: "noreply@itep.rn.gov.br",
      }) as never,
      mailer as never,
    );
    jest.spyOn(service["logger"], "log").mockImplementation(() => undefined);

    expect(service.isEnabled()).toBe(true);

    const sent = await service.send(
      "admin@itep.rn.gov.br",
      "Assunto",
      "Corpo",
      "<p>Corpo</p>",
    );

    expect(sent).toBe(true);
    expect(mailer.sendMail).toHaveBeenCalledWith({
      from: "noreply@itep.rn.gov.br",
      to: "admin@itep.rn.gov.br",
      subject: "Assunto",
      text: "Corpo",
      html: "<p>Corpo</p>",
    });
  });

  it("trata falha do transport sem lancar (fire-and-forget seguro)", async () => {
    const mailer = createMockMailer();
    mailer.sendMail.mockRejectedValue(new Error("SMTP indisponível"));
    const service = new MailService(
      createConfig({ host: "smtp.example.com" }) as never,
      mailer as never,
    );
    jest.spyOn(service["logger"], "warn").mockImplementation(() => undefined);

    const sent = await service.send("x@y.z", "Assunto", "Corpo");

    expect(sent).toBe(false);
  });

  it("sendIpBlockedNotification skipa quando ADMIN_EMAIL nao esta configurado", async () => {
    const mailer = createMockMailer();
    const service = new MailService(
      createConfig({ host: "smtp.example.com" }) as never,
      mailer as never,
    );

    await service.sendIpBlockedNotification("10.0.0.1", "tentativas", 5);

    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it("sendIpBlockedNotification envia para ADMIN_EMAIL quando configurado", async () => {
    const mailer = createMockMailer();
    const service = new MailService(
      createConfig(
        { host: "smtp.example.com" },
        "admin@itep.rn.gov.br",
      ) as never,
      mailer as never,
    );
    jest.spyOn(service["logger"], "log").mockImplementation(() => undefined);

    await service.sendIpBlockedNotification(
      "10.0.0.1",
      "tentativas falhadas",
      5,
    );

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    const call = mailer.sendMail.mock.calls[0][0];
    expect(call.to).toBe("admin@itep.rn.gov.br");
    expect(call.subject).toContain("10.0.0.1");
    expect(call.text).toContain("tentativas falhadas");
    expect(call.text).toContain("5");
  });
});
