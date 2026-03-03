export const DOCUMENT_SEARCH_TYPES = [
  "desarquivamento",
  "pasta",
  "planilha",
] as const;

export type DocumentSearchType = (typeof DOCUMENT_SEARCH_TYPES)[number];

export type GlobalSearchResultType =
  | DocumentSearchType
  | "usuario"
  | "tarefa"
  | "projeto"
  | "vestigio"
  | "notificacao";

export interface SearchResultItem {
  id: number | string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface SearchDocument extends Omit<SearchResultItem, "id" | "type"> {
  id: string;
  entityId: number | string;
  type: DocumentSearchType;
  searchText: string;
  visibilityScope: "authenticated" | "restricted";
  allowedUserIds: number[];
  fullAccessRoles: string[];
  sortTimestamp: number;
}

export interface SearchHealthStatus {
  enabled: boolean;
  status: "disabled" | "ready" | "degraded";
  indexUid: string;
  failOpen: boolean;
  bootstrapOnStart: boolean;
  message?: string;
}
