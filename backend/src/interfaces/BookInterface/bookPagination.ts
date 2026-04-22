import type { BookData } from "./adminAddBook";

// query parameter pagination
export interface BookPaginationQuery {
    page?: number
    limit?: number
    search?: string
    category?: string
}

// meta pagination response
export interface BookPaginationMeta {
    page: number
    limit: number
    totalItems: number
    totalPages: number
}

// response pagination
export interface BookPaginationResponse {
    message: string
    data: BookData[]
    meta: BookPaginationMeta
}

// mapper response pagination
export function toBookPaginationResponse(
    data: BookData[], 
    meta: BookPaginationMeta
): BookPaginationResponse {
    return {
        message: "Data retrieved successfully",
        data,
        meta
    };
}
