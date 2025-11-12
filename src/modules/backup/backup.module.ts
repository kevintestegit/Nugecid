import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './services/backup.service';
import { SystemSettingsService } from './services/system-settings.service';
import { BackupController } from './controllers/backup.controller';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { SystemSettings } from './entities/system-settings.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([SystemSettings]),
  ],
  controllers: [BackupController, SystemSettingsController],
  providers: [BackupService, SystemSettingsService],
  exports: [BackupService, SystemSettingsService],
})
export class BackupModule {}
