import type {  BorrowingStatus } from "../../../generated/prisma/client";


// interface untuk request create borrowing
export interface CreateBorrowingRequest {
    bookId: number
    dueDate: string
}

export interface UpdateBorrowingStatusRequest {
    status: BorrowingStatus
}

export interface BorrowingPaginationQuery {
    page?: number
    limit?: number
    status?: BorrowingStatus
    search?: string
}