import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromAddress: string;
  private readonly enabled: boolean;
  private readonly adminEmail: string | undefined;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    const email = this.configService.get<EmailConfig>("app.email");
    this.fromAddress = email?.from ?? "noreply@itep.rn.gov.br";
    this.enabled = Boolean(email?.host);
    this.adminEmail = this.configService.get<string>("ADMIN_EMAIL");
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(
        `Email desabilitado (EMAIL_HOST não configurado). Assunto: "${subject}"`,
      );
      return false;
    }

    try {
      await this.mailerService.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Email enviado para ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.warn(
        `Falha ao enviar email para ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  async sendIpBlockedNotification(
    ipAddress: string,
    reason: string,
    blockedBy: number | null,
  ): Promise<void> {
    if (!this.adminEmail) {
      return;
    }

    const subject = `[SGC-ITEP] IP bloqueado: ${ipAddress}`;
    const text = [
      `O IP ${ipAddress} foi bloqueado no sistema SGC-ITEP.`,
      ``,
      `Razão: ${reason || "Não especificada"}`,
      `Bloqueado por: ${blockedBy ?? "Sistema"}`,
      `Data: ${new Date().toISOString()}`,
    ].join("\n");

    await this.send(this.adminEmail, subject, text);
  }
}
