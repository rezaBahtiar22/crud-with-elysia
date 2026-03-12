import type { BorrowingResponse, BorrowingPaginationResponse } from "./borrowingResponse";


// fungsi mapper untuk response borrowing
export function toBorrowingResponse(borrowing: any): BorrowingResponse {
  return {
    id: borrowing.id,
    userId: borrowing.userId,
    bookId: borrowing.bookId,
    borrowAt: borrowing.borrowedAt.toISOString(),
    dueDate: borrowing.dueDate.toISOString(),
    returnedAt: borrowing.returnedAt ? borrowing.returnedAt.toISOString() : null,
    status: borrowing.status,
    fine: borrowing.fine,
    created_at: borrowing.created_at.toISOString(),
    updated_at: borrowing.updated_at.toISOString(),
    user: {
      id: borrowing.user.id,
      name: borrowing.user.name,
      email: borrowing.user.email,
    },
    book: {
      id: borrowing.book.id,
      title: borrowing.book.title,
      author: borrowing.book.author,
      cover: borrowing.book.cover,
      isbn: borrowing.book.isbn,
    },
  };
}
 
export function toBorrowingPaginationResponse(
  borrowings: any[],
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
): BorrowingPaginationResponse {
  return {
    data: borrowings.map(toBorrowingResponse),
    meta,
  };
}