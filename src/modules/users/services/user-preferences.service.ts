import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserPreference } from "../entities/user-preference.entity";

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly userPreferenceRepository: Repository<UserPreference>,
  ) {}

  async getPreference(userId: number, key: string): Promise<any> {
    const preference = await this.userPreferenceRepository.findOne({
      where: { userId, preferenceKey: key },
    });

    return preference ? preference.preferenceValue : null;
  }

  async getAllPreferences(userId: number): Promise<Record<string, any>> {
    const preferences = await this.userPreferenceRepository.find({
      where: { userId },
    });

    return preferences.reduce((acc, pref) => {
      acc[pref.preferenceKey] = pref.preferenceValue;
      return acc;
    }, {});
  }

  async setPreference(
    userId: number,
    key: string,
    value: any,
  ): Promise<UserPreference> {
    let preference = await this.userPreferenceRepository.findOne({
      where: { userId, preferenceKey: key },
    });

    if (preference) {
      preference.preferenceValue = value;
    } else {
      preference = this.userPreferenceRepository.create({
        userId,
        preferenceKey: key,
        preferenceValue: value,
      });
    }

    return this.userPreferenceRepository.save(preference);
  }

  async deletePreference(userId: number, key: string): Promise<void> {
    const result = await this.userPreferenceRepository.delete({
      userId,
      preferenceKey: key,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Preference with key "${key}" not found for user`,
      );
    }
  }

  async deleteAllPreferences(userId: number): Promise<void> {
    await this.userPreferenceRepository.delete({ userId });
  }
}
