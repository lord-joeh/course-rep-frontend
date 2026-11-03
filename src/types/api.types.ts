export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, unknown>;
  timestamp: string;
  path?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta?: PaginationMeta;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}
