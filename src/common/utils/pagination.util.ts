export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(
  page?: string,
  limit?: string,
): PaginationParams | undefined {
  if (!page && !limit) {
    return undefined;
  }

  const parsedPage = Number.parseInt(page ?? String(DEFAULT_PAGE), 10);
  const parsedLimit = Number.parseInt(limit ?? String(DEFAULT_LIMIT), 10);

  const safePage =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.floor(parsedPage)
      : DEFAULT_PAGE;
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(MAX_LIMIT, Math.floor(parsedLimit))
      : DEFAULT_LIMIT;

  return { page: safePage, limit: safeLimit };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationParams,
): PaginatedResult<T> {
  const totalPages = total === 0 ? 1 : Math.ceil(total / pagination.limit);
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
  };
}
