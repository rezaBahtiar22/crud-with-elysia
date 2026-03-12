import type {  BorrowingStatus } from "../../../generated/prisma/client";


// interface untuk response get borrowing
export interface BorrowingResponse {
    id: number
    userId: number
    bookId: number
    borrowAt: Date
    dueDate: Date
    returnedAt: Date | null
    status: BorrowingStatus
    fine: number
    created_at: Date
    updated_at: Date
    user: {
        id: number
        name: string
        email: string
    };
    book: {
        id: number
        title: string
        author: string
        cover: string | null
        isbn: string
    }
}


export interface BorrowingPaginationResponse {
  data: BorrowingResponse[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}