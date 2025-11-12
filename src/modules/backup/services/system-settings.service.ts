import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from '../entities/system-settings.entity';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSettings)
    private readonly systemSettingsRepository: Repository<SystemSettings>,
  ) {}

  /**
   * Busca as configurações do sistema (sempre a primeira linha)
   */
  async getSettings(): Promise<SystemSettings> {
    let settings = await this.systemSettingsRepository.findOne({
      where: { id: 1 },
    });

    // Se não existir, cria com valores padrão
    if (!settings) {
      settings = this.systemSettingsRepository.create({
        autoBackup: true,
        backupFrequency: 'daily',
        logLevel: 'info',
        maintenanceMode: false,
        cacheEnabled: true,
      });
      settings = await this.systemSettingsRepository.save(settings);
      this.logger.log('Configurações do sistema criadas com valores padrão');
    }

    return settings;
  }

  /**
   * Atualiza as configurações do sistema
   */
  async updateSettings(updateDto: UpdateSystemSettingsDto): Promise<SystemSettings> {
    const settings = await this.getSettings();

    // Atualiza apenas os campos fornecidos
    Object.assign(settings, updateDto);

    const updatedSettings = await this.systemSettingsRepository.save(settings);

    this.logger.log('Configurações do sistema atualizadas');
    this.logger.debug('Novas configurações:', updatedSettings);

    return updatedSettings;
  }

  /**
   * Reseta configurações para valores padrão
   */
  async resetToDefaults(): Promise<SystemSettings> {
    const settings = await this.getSettings();

    settings.autoBackup = true;
    settings.backupFrequency = 'daily';
    settings.logLevel = 'info';
    settings.maintenanceMode = false;
    settings.cacheEnabled = true;

    const resetSettings = await this.systemSettingsRepository.save(settings);

    this.logger.log('Configurações do sistema resetadas para valores padrão');

    return resetSettings;
  }
}
