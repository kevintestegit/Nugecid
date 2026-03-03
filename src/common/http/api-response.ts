export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  data: T;
  message?: string;
  partial?: boolean;
  warnings?: string[];
  meta?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
}

export function isApiResponseEnvelope(
  value: unknown,
): value is ApiSuccessResponse<unknown> | ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success?: unknown }).success === "boolean"
  );
}

export function buildApiSuccessResponse<T>(params: {
  data: T;
  statusCode: number;
  path: string;
  method: string;
  message?: string;
  partial?: boolean;
  warnings?: string[];
  meta?: unknown;
}): ApiSuccessResponse<T> {
  return {
    success: true,
    statusCode: params.statusCode,
    timestamp: new Date().toISOString(),
    path: params.path,
    method: params.method,
    data: params.data,
    ...(params.message ? { message: params.message } : {}),
    ...(typeof params.partial === "boolean" ? { partial: params.partial } : {}),
    ...(params.warnings ? { warnings: params.warnings } : {}),
    ...(typeof params.meta !== "undefined" ? { meta: params.meta } : {}),
  };
}

export function buildApiErrorResponse(params: {
  statusCode: number;
  path: string;
  method: string;
  message: string | string[];
}): ApiErrorResponse {
  return {
    success: false,
    statusCode: params.statusCode,
    timestamp: new Date().toISOString(),
    path: params.path,
    method: params.method,
    message: params.message,
  };
}
