import { MailService } from "./mail.service";

const createMockMailer = () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: "test-1" }),
});

const createConfig = (email: any, adminEmail?: string) => ({
  get: jest.fn((key: string) => {
    if (key === "app.email") return email;
    if (key === "ADMIN_EMAIL") return adminEmail;
    return undefined;
  }),
});

describe("MailService", () => {
  it("skipa envio quando EMAIL_HOST nao esta configurado (degrade graceful)", async () => {
    const mailer = createMockMailer();
    const service = new MailService(mailer as never, createConfig({}) as never);

    expect(service.isEnabled()).toBe(false);

    const sent = await service.send("admin@itep.rn.gov.br", "Teste", "Corpo");

    expect(sent).toBe(false);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it("envia email quando EMAIL_HOST esta configurado", async () => {
    const mailer = createMockMailer();
    const service = new MailService(
      mailer as never,
      createConfig({
        host: "smtp.example.com",
        port: 587,
        from: "noreply@itep.rn.gov.br",
      }) as never,
    );

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
      mailer as never,
      createConfig({ host: "smtp.example.com" }) as never,
    );

    const sent = await service.send("x@y.z", "Assunto", "Corpo");

    expect(sent).toBe(false);
  });

  it("sendIpBlockedNotification skipa quando ADMIN_EMAIL nao esta configurado", async () => {
    const mailer = createMockMailer();
    const service = new MailService(
      mailer as never,
      createConfig({ host: "smtp.example.com" }) as never,
    );

    await service.sendIpBlockedNotification("10.0.0.1", "tentativas", 5);

    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it("sendIpBlockedNotification envia para ADMIN_EMAIL quando configurado", async () => {
    const mailer = createMockMailer();
    const service = new MailService(
      mailer as never,
      createConfig(
        { host: "smtp.example.com" },
        "admin@itep.rn.gov.br",
      ) as never,
    );

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
