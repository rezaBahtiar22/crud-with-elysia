import { prisma } from "../database/prisma";

import type { BookDataRequest, BookDataResponse } from "../interfaces/BookInterface/adminAddBook";
import { toAdminAddBookResponse } from "../interfaces/BookInterface/adminAddBook";

import type {  AdminUpdateBookRequest, AdminUpdateBookResponse } from "../interfaces/BookInterface/adminUpdateBook";

import type { BookPaginationQuery } from "../interfaces/BookInterface/bookPagination";
import { toBookPaginationResponse } from "../interfaces/BookInterface/bookPagination";

import { ResponseError } from "../utils/responseError";
import { Validation } from "../utils/validation";
import { BookValidation } from "../utils/bookValidation";
import { esClient } from "../utils/elasticsearch";



export class AdminBookService {

    // books pagination dan filter buku
    static async bookPagination(query: BookPaginationQuery) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        
        let totalItems = 0;

        /* 
        // JIKA ADA SEARCH, GUNAKAN ELASTICSEARCH
        ... (blok ES sebelumnya) ...
        */

        // total buku sesuai filter
        totalItems = await prisma.book.count({
            where: {
                deletedAt: null,
                ...(query.search && {
                    OR: [
                        { title: { contains: query.search, mode: "insensitive" } },
                        { author: { contains: query.search, mode: "insensitive" } }
                    ]
                }),
                ...(query.category && {
                    category: { equals: query.category, mode: "insensitive" }
                })
            }
        });

        // data buku
        const books = await prisma.book.findMany({
            where: {
                deletedAt: null,
                ...(query.search && {
                    OR: [
                        { title: { contains: query.search, mode: "insensitive" } },
                        { author: { contains: query.search, mode: "insensitive" } }
                    ]
                }),
                ...(query.category && {
                    category: { equals: query.category, mode: "insensitive" }
                })
            },
            skip, 
            take: limit,
            orderBy: { created_at: "desc" },
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
                readLink: true,
                bookFile: true,
                stock: true,
                availableStock: true,
                created_at: true,
                updated_at: true
            }
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
                readLink: book.readLink,
                bookFile: book.bookFile,
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
        try {
            // validasi request
            const data = Validation.validate<BookDataRequest>(BookValidation.createBook, body);

            // cek apakah ISBN sudah terdaftar (termasuk yang soft-deleted)
            const exist = await prisma.book.findUnique({
                where: {
                    isbn: data.isbn
                }
            });

            if (exist) {
                // Jika buku ada tapi TIDAK terhapus, baru throw error
                if (exist.deletedAt === null) {
                    throw new ResponseError(
                        409,
                        "ISBN_Already_Exist",
                        "ISBN sudah terdaftar"
                    );
                }

                // JIKA BUKU ADA TAPI STATUSNYA TERHAPUS (Soft-Deleted)
                // Kita "Restore" atau bangkitkan kembali datanya
                if (data.cover === '') data.cover = null;
                
                let savedFilePath: string | null = null;
                if (data.bookFile && data.bookFile instanceof File) {
                    savedFilePath = await AdminBookService.saveBookFile(data.bookFile, data.isbn);
                }

                const restoredBook = await prisma.book.update({
                    where: { id: exist.id },
                    data: {
                        title: data.title,
                        author: data.author,
                        publisher: data.publisher ?? null,
                        year: data.year ?? null,
                        category: data.category ?? null,
                        description: data.description ?? null,
                        cover: data.cover ?? null,
                        readLink: data.readLink ?? null,
                        bookFile: savedFilePath,
                        stock: data.stock,
                        availableStock: data.stock,
                        deletedAt: null, // BATALKAN PENGHAPUSAN
                        created_at: new Date() // Perbarui waktu buat agar muncul di paling atas
                    }
                });

                // Index ulang ke ES (Dinonaktifkan sementara)
                // await this.indexToES(restoredBook);
                return toAdminAddBookResponse(restoredBook);
            }

            if (data.cover === '') {
                data.cover = null;
            }

            // Simpan file buku jika ada
            let savedFilePath: string | null = null;
            if (data.bookFile && data.bookFile instanceof File) {
                savedFilePath = await AdminBookService.saveBookFile(data.bookFile, data.isbn);
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
                    readLink: data.readLink ?? null,
                    bookFile: savedFilePath,
                    stock: data.stock,
                    availableStock: data.stock
                }
            });

            // INDEX KE ELASTICSEARCH (Dinonaktifkan sementara)
            // await AdminBookService.indexToES(book);

            return toAdminAddBookResponse(book);
        } catch (e) {
            console.error("ERROR DI ADDBOOK:", e);
            throw e;
        }
    }

    private static async indexToES(book: any) {
        /*
        try {
            await esClient.index({
                index: 'books',
                id: book.id.toString(),
                document: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    isbn: book.isbn,
                    publisher: book.publisher,
                    category: book.category,
                    description: book.description,
                    cover: book.cover,
                    readLink: book.readLink,
                    bookFile: book.bookFile,
                    created_at: book.created_at
                }
            });
        } catch (error) {
            console.error("Gagal index ke ES:", error);
        }
        */
    }

    // Helper untuk simpan file buku
    private static async saveBookFile(file: File, isbn: string): Promise<string> {
        const uploadDir = 'public/uploads/books';
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extension = file.name.split('.').pop();
        const fileName = `${isbn}_${Date.now()}.${extension}`;
        const filePath = `${uploadDir}/${fileName}`;
        
        const arrayBuffer = await file.arrayBuffer();
        await Bun.write(filePath, arrayBuffer);
        
        return `/uploads/books/${fileName}`;
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

        if (data.cover === '') data.cover = null;
        if (data.readLink === '') data.readLink = null;

        // Simpan file buku baru jika diunggah
        let savedFilePath = book.bookFile;
        if (data.bookFile && data.bookFile instanceof File) {
            // Hapus file lama jika ada
            if (book.bookFile) {
                const fs = require('fs');
                const oldPath = `public${book.bookFile}`;
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            savedFilePath = await AdminBookService.saveBookFile(data.bookFile, data.isbn || book.isbn);
        }

        // update buku
        const updated = await prisma.book.update({
            where: { id },
            data: { 
                title: data.title !== undefined ? data.title : book.title,
                author: data.author !== undefined ? data.author : book.author,
                isbn: data.isbn !== undefined ? data.isbn : book.isbn,
                publisher: data.publisher !== undefined ? data.publisher : book.publisher,
                year: data.year !== undefined ? data.year : book.year,
                category: data.category !== undefined ? data.category : book.category,
                description: data.description !== undefined ? data.description : book.description,
                cover: data.cover !== undefined ? data.cover : book.cover,
                readLink: data.readLink !== undefined ? data.readLink : book.readLink,
                bookFile: savedFilePath,
                stock: data.stock !== undefined ? data.stock : book.stock,
                availableStock
             }
        });

        // UPDATE DI ELASTICSEARCH (Dinonaktifkan sementara)
        // await AdminBookService.indexToES(updated);

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

        /* 
        // HAPUS DARI ELASTICSEARCH (atau kita bisa biarkan tapi filter deletedAt di query ES)
        try {
            await esClient.delete({
                index: 'books',
                id: id.toString()
            });
        } catch (error) {
            console.error("Gagal hapus di ES:", error);
        }
        */

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

        const result =  toAdminAddBookResponse(book);

        return {
            ...result,
            message: "Buku ditemukan",
        }
    }

}
