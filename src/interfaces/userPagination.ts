// request query pagination
export interface UserPaginationQuery {
  page?: number;
  limit?: number;
}

// response pagination meta
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// response utama pagination
export interface UserPaginationResponse<T> {
  data: T;
  pagination: PaginationMeta;
}