import { api } from './api';
import { Nugecid, NugecidPage } from '@/pages/nugecid/types/nugecid.types';
import { ImportResultDto } from '@/modules/nugecid/dto/import-result.dto';

const API_URL = '/nugecid';

const getById = (id: number): Promise<Nugecid> => {
  return api.get(`${API_URL}/${id}`);
};

const getPaginated = (page: number, limit: number, filters: any): Promise<NugecidPage> => {
  return api.get(API_URL, { params: { page, limit, ...filters } });
};

const create = (data: Partial<Nugecid>): Promise<Nugecid> => {
  return api.post(API_URL, data);
};

const update = (id: number, data: Partial<Nugecid>): Promise<Nugecid> => {
  return api.patch(`${API_URL}/${id}`, data);
};

const remove = (id: number): Promise<void> => {
  return api.delete(`${API_URL}/${id}`);
};

const exportToExcel = (filters: any): Promise<Blob> => {
  return api.get(`${API_URL}/export`, { 
    params: filters,
    responseType: 'blob' 
  });
};

const importPlanilha = async (file: File): Promise<ImportResultDto> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ImportResultDto>(`${API_URL}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};

export const nugecidService = {
  getById,
  getPaginated,
  create,
  update,
  remove,
  exportToExcel,
  importPlanilha
};