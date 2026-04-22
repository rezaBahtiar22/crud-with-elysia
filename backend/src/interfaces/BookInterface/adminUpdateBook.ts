import type { Book } from "../../../generated/prisma";
import type { BookData } from "./adminAddBook";


// request update book
export interface AdminUpdateBookRequest {
    title?: string
    author?: string
    isbn?: string
    publisher?: string
    year?: number
    category?: string
    description?: string
    cover?: string | null
    stock?: number
}

// response update book
export interface AdminUpdateBookResponse {
    message: string
    data: BookData
}

// mapper untuk response update buku
export function toAdminUpdateBookResponse(book: Book): AdminUpdateBookResponse {
    return {
        message: "Book updated successfully",
        data: {
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            publisher: book.publisher,
            year: book.year,
            category: book.category,
            description: book.description,
            cover: book.cover,
            stock: book.stock,
            availableStock: book.availableStock,
            created_at: book.created_at.toISOString(),
            updated_at: book.updated_at.toISOString()
        }
    }
}
