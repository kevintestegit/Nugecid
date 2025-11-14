import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreferences } from '../entities/notification-preferences.entity';
import { UpdateNotificationPreferencesDto } from '../dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(NotificationPreferences)
    private readonly preferencesRepository: Repository<NotificationPreferences>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Obtém ou cria preferências de notificação para um usuário
   */
  async getOrCreatePreferences(userId: number): Promise<NotificationPreferences> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar preferências existentes
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    // Se não existir, criar com valores padrão
    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        inAppEnabled: true,
        pushEnabled: false,
        soundEnabled: true,
        enabledTypes: {
          solicitacao_pendente: true,
          novo_processo: true,
          novo_desarquivamento: true,
          mencao: true,
          tarefa_atribuida: true,
          tarefa_alterada: true,
          tarefa_comentada: true,
          prazo_proximo: true,
          tarefa_atrasada: true,
          projeto_atualizado: true,
          novo_registro: true,
          pasta_criada: true,
          evento_auditoria: false,
        },
      });
      preferences = await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  /**
   * Obtém preferências de notificação de um usuário
   */
  async getPreferences(userId: number): Promise<NotificationPreferences> {
    return this.getOrCreatePreferences(userId);
  }

  /**
   * Atualiza preferências de notificação de um usuário
   */
  async updatePreferences(
    userId: number,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);

    // Atualizar campos
    if (updateDto.inAppEnabled !== undefined) {
      preferences.inAppEnabled = updateDto.inAppEnabled;
    }

    if (updateDto.pushEnabled !== undefined) {
      preferences.pushEnabled = updateDto.pushEnabled;
    }

    if (updateDto.soundEnabled !== undefined) {
      preferences.soundEnabled = updateDto.soundEnabled;
    }

    if (updateDto.enabledTypes !== undefined) {
      preferences.enabledTypes = {
        ...preferences.enabledTypes,
        ...updateDto.enabledTypes,
      };
    }

    if (updateDto.pushSubscription !== undefined) {
      preferences.pushSubscription = updateDto.pushSubscription;
    }

    return this.preferencesRepository.save(preferences);
  }

  /**
   * Atualiza a push subscription de um usuário
   */
  async updatePushSubscription(
    userId: number,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    } | null,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    preferences.pushSubscription = subscription;
    return this.preferencesRepository.save(preferences);
  }

  /**
   * Remove a push subscription de um usuário
   */
  async removePushSubscription(userId: number): Promise<NotificationPreferences> {
    return this.updatePushSubscription(userId, null);
  }

  /**
   * Verifica se um usuário pode receber uma notificação de um tipo específico
   */
  async canReceiveNotification(
    userId: number,
    notificationType: string,
    channel: 'in_app' | 'push' = 'in_app',
  ): Promise<boolean> {
    const preferences = await this.getOrCreatePreferences(userId);
    return preferences.canReceiveNotification(notificationType, channel);
  }

  /**
   * Habilita um tipo de notificação para um usuário
   */
  async enableNotificationType(
    userId: number,
    notificationType: string,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    preferences.enableType(notificationType);
    return this.preferencesRepository.save(preferences);
  }

  /**
   * Desabilita um tipo de notificação para um usuário
   */
  async disableNotificationType(
    userId: number,
    notificationType: string,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    preferences.disableType(notificationType);
    return this.preferencesRepository.save(preferences);
  }

  /**
   * Reseta preferências para os valores padrão
   */
  async resetToDefaults(userId: number): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);

    preferences.inAppEnabled = true;
    preferences.pushEnabled = false;
    preferences.soundEnabled = true;
    preferences.pushSubscription = null;
    preferences.enabledTypes = {
      solicitacao_pendente: true,
      novo_processo: true,
      novo_desarquivamento: true,
      mencao: true,
      tarefa_atribuida: true,
      tarefa_alterada: true,
      tarefa_comentada: true,
      prazo_proximo: true,
      tarefa_atrasada: true,
      projeto_atualizado: true,
      novo_registro: true,
      pasta_criada: true,
      evento_auditoria: false,
    };

    return this.preferencesRepository.save(preferences);
  }
}
