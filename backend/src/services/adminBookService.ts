import { prisma } from "../database/prisma";

import type { BookData } from "../interfaces/BookInterface/adminAddBook";

import type { BookDataRequest, BookDataResponse } from "../interfaces/BookInterface/adminAddBook";
import { toAdminAddBookResponse } from "../interfaces/BookInterface/adminAddBook";

import type {  AdminUpdateBookRequest, AdminUpdateBookResponse } from "../interfaces/BookInterface/adminUpdateBook";
import { toAdminUpdateBookResponse } from "../interfaces/BookInterface/adminUpdateBook";

import type { BookPaginationQuery } from "../interfaces/BookInterface/bookPagination";
import { toBookPaginationResponse } from "../interfaces/BookInterface/bookPagination";

import { ResponseError } from "../utils/responseError";
import { Validation } from "../utils/validation";
import { BookValidation } from "../utils/bookValidation";



export class AdminBookService {

    // books pagination dan filter buku
    static async bookPagination(query: BookPaginationQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        // total buku
        const totalItems = await prisma.book.count({
            where: {
                deletedAt: null
            }
        });

        // data buku dan filter search
        const books = await prisma.book.findMany({
            where: {
                deletedAt: null,

                // filter berdasarkan judul atau penulis
                ...(query.search && {
                    OR: [
                        {
                            title: { contains: query.search, mode: "insensitive" }
                        },
                        {
                            author: { contains: query.search, mode: "insensitive" }
                        }
                    ]
                }),
                
                // filter berdasarkan kategori
                ...(query.category && {
                    category: { equals: query.category, mode: "insensitive" }
                })
            },
            skip,
            take: limit,
            orderBy: {
                created_at: "desc",
            },
            select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                publisher: true,
                year: true,
                category: true,
                description: true,
                cover: true,
                stock: true,
                availableStock: true,
                created_at: true,
                updated_at: true
            },
        });

        const totalPages = Math.ceil(totalItems / limit);

        return toBookPaginationResponse(
            books.map(book => ({
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
            })),
            { page, limit, totalItems, totalPages }
        );
    }

    // tambah buku baru
    static async addBook(
        body: BookDataRequest
    ): Promise<BookDataResponse> {
        // validasi request
        const data = Validation.validate<BookDataRequest>(BookValidation.createBook, body);

        // cek apakah ISBN sudah terdaftar
        const exist = await prisma.book.findUnique({
            where: {
                isbn: data.isbn
            }
        });

        if (exist) {
            throw new ResponseError(
                409,
                "ISBN_Already_Exist",
                "ISBN sudah terdaftar"
            );
        }

        // buat buku baru
        const book = await prisma.book.create({
            data: {
                title: data.title,
                author: data.author,
                isbn: data.isbn,
                publisher: data.publisher ?? null,
                year: data.year ?? null,
                category: data.category ?? null,
                description: data.description ?? null,
                cover: data.cover ?? null,
                stock: data.stock,
                availableStock: data.stock
            }
        });

        return toAdminAddBookResponse(book);
    }

    // update buku
    static async updateBook(
        id: number,
        body: AdminUpdateBookRequest
    ): Promise<AdminUpdateBookResponse> {
        // validasi body
        const data = Validation.validate<AdminUpdateBookRequest>(BookValidation.updateBook, body);

        // cek apakah buku ada pada DB
        const book = await prisma.book.findFirst({
            where: {
                id, deletedAt: null
            }
        });

        if (!book) {
            throw new ResponseError(
                404,
                "Book_Not_Found",
                "Buku tidak ditemukan"
            );
        }

        // cek jika isbn diubah, apakah sudah sudah dipakai oleh buku lain
        if (data.isbn && data.isbn !== book.isbn) {
            const isbnExist = await prisma.book.findUnique({
                where: {
                    isbn: data.isbn
                }
            });
            if (isbnExist) {
                throw new ResponseError(
                    409,
                    "ISBN_Already_Exists",
                    "ISBN sudah digunakan buku lain"
                );
            }
        }

        // hitung available baru jika stock diubah
        let availableStock = book.availableStock;
        if (data.stock !== undefined) {
            const diff = data.stock - book.stock;
            availableStock = book.availableStock + diff;

            // available stock tidak boleh negatif
            if (availableStock < 0) availableStock = 0;
        }

        // update buku
        const updated = await prisma.book.update({
            where: { id },
            data: { 
                ...data,
                availableStock
             }
        });

        return toAdminAddBookResponse(updated);
    }

    // hapus buku (soft delete)
    static async deleteBook(id: number) {
        // cek apakah buku ada
        const book = await prisma.book.findFirst({
            where: { id, deletedAt: null }
        });

        if (!book) {
            throw new ResponseError(
                404,
                "Book_Not_Found",
                "Buku tidak ditemukan"
            );
        }

        // soft delete — isi deletedAt dengan waktu sekarang
        // buku tidak benar-benar dihapus dari database
        await prisma.book.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return { message: "Buku berhasil dihapus" };
    }

    // ambil satu buku by id
    static async getBookById(id: number) {
        const book = await prisma.book.findFirst({
            where: { id, deletedAt: null }
        });

        if (!book) {
            throw new ResponseError(
                404,
                "Book_Not_Found",
                "Buku tidak ditemukan"
            );
        }

        return toAdminAddBookResponse(book);
    }

}