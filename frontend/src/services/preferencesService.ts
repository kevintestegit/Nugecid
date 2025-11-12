import { api } from './api';

export interface UserPreference {
  key: string;
  value: any;
  updatedAt: string;
}

export class PreferencesService {
  private baseUrl = '/users/me/preferences';

  async getAll(): Promise<Record<string, any>> {
    const response = await api.get<Record<string, any>>(this.baseUrl);
    return response.data;
  }

  async get(key: string): Promise<any> {
    try {
      const response = await api.get<{ key: string; value: any }>(`${this.baseUrl}/${key}`);
      return response.data.value;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async set(key: string, value: any): Promise<UserPreference> {
    const response = await api.post<{ message: string; preference: UserPreference }>(
      this.baseUrl,
      { key, value }
    );
    return response.data.preference;
  }

  async delete(key: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${key}`);
  }

  async deleteAll(): Promise<void> {
    await api.delete(this.baseUrl);
  }
}

export const preferencesService = new PreferencesService();
export default preferencesService;
