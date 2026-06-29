import { Global, Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from?: string;
}

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const email = config.get<EmailConfig>("app.email");
        return {
          transport: {
            host: email?.host,
            port: email?.port ?? 587,
            secure: email?.secure ?? false,
            auth: email?.user
              ? { user: email.user, pass: email?.password }
              : undefined,
          },
          defaults: {
            from: email?.from ?? "noreply@itep.rn.gov.br",
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
