import type {  BorrowingStatus } from "../../../generated/prisma";


// interface untuk request create borrowing
export interface CreateBorrowingRequest {
    bookId: number
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
