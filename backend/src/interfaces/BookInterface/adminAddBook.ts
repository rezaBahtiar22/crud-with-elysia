import type { Book } from "../../../generated/prisma";


// interface data buku
export interface BookData {
    id: number
    title: string
    author: string
    isbn: string
    publisher: string | null
    year: number | null
    category: string | null
    description: string | null
    cover: string | null
    stock: number
    availableStock: number
    created_at: string
    updated_at: string
}

// interface tambah buku request
export interface BookDataRequest {
    title: string
    author: string
    isbn: string
    publisher?: string | null
    year?: number | null
    category?: string | null
    description?: string | null
    cover?: string | null
    stock?: number
}

// response tambah buku
export interface BookDataResponse {
    message: string
    data: BookData
}

// mapper untuk response tambah buku
export function toAdminAddBookResponse(book: Book): BookDataResponse {
    return {
        message: "Book added successfully",
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
