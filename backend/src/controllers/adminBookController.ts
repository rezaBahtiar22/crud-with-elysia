import { AdminBookService } from "../services/adminBookService";
import type { AuthContext } from "../@types/context";
import type { BookDataRequest, BookDataResponse } from "../interfaces/BookInterface/adminAddBook";
import type { AdminUpdateBookRequest, AdminUpdateBookResponse } from "../interfaces/BookInterface/adminUpdateBook";


export class AdminBookController {

    // pagination book
    static async bookPagination(ctx: AuthContext) {
        // konversi query string ke number
        const page  = Number(ctx.query.page)  || 1;
        const limit = Number(ctx.query.limit) || 10;

        return await AdminBookService.bookPagination({
            page,
            limit,
            search:   ctx.query.search   as string | undefined,
            category: ctx.query.category as string | undefined,
        });
    }

    // tambah buku baru
    static async addBook(
        body: BookDataRequest
    ): Promise<BookDataResponse> {
        return await AdminBookService.addBook(body);
    }

    // update buku baru
    static async updateBook(
        id: number,
        body: AdminUpdateBookRequest
    ): Promise<AdminUpdateBookResponse> {
        return await AdminBookService.updateBook(id, body);
    }

    // ambil satu buku by id
    static async getBookById(
        id: number
    ): Promise<BookDataResponse> {
        return await AdminBookService.getBookById(id);
    }

    // hapus buku (soft delete)
    static async deleteBook(
        id: number
    ): Promise<{ message: string }> {
        return await AdminBookService.deleteBook(id);
    }

}
