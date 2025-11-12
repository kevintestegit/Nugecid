export interface QueryUsersDto {
  nome?: string;
  usuario?: string;
  ativo?: boolean;
  active?: string;
  roleId?: number;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}
