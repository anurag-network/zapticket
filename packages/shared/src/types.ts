export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TicketFilters extends PaginationParams {
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
}
