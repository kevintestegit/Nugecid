import axios from "axios";
import { api } from "./api";

export interface UserPreference {
  key: string;
  value: unknown;
  updatedAt: string;
}

export class PreferencesService {
  private baseUrl = "/users/me/preferences";

  async getAll(): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>(this.baseUrl);
    return response.data;
  }

  async get(key: string): Promise<unknown> {
    try {
      const response = await api.get<{ key: string; value: unknown }>(
        `${this.baseUrl}/${key}`,
      );
      return response.data.value;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async set(key: string, value: unknown): Promise<UserPreference> {
    const response = await api.post<{
      message: string;
      preference: UserPreference;
    }>(this.baseUrl, { key, value });
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
