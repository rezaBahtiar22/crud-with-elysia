import { BorrowingService } from "../services/borrowingService";
import type { AuthContext } from "../@types/context";
import type { Context } from "elysia";

export class BorrowingController {

    // user ajukan pinjaman
    static async createBorrowing({
        body, user, set
    }: AuthContext) {
        const result = await BorrowingService.CreateBorrowing(user.id, body as any);
        set.status = 201;
        return { 
            success: true,
            message: "Pinjaman berhasil diajukan",
            data: result
         }
    }

    // user melihat pinjaman sendiri
    static async getMyBorrowings({
        query, user
    }: AuthContext) {
        const result =  await BorrowingService.getUserBorrowing(
            user.id, {
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 10,
                status: query.status as any,
            }
        );
        return { success: true, ...result };
    }

    // detail pinjaman diri sendiri
    static async getMyBorrowingById({
        params, user
    }: AuthContext) {
        const result = await BorrowingService.getBorrowingById(Number(params.id), user.id);
        return { success: true, data: result };
    }

    // admin melihat semua pinjaman
    static async getAllBorrowings({
        query
    }: AuthContext) {
        const result = await BorrowingService.getAllBorrowings({
            page: query.page ? Number(query.page) : 1,
            limit: query.page ? Number(query.limit) : 10,
            status: query.status as any,
            search: query.search as string | undefined,
        });
        return { success: true, ...result };
    }

    // admin detail pinjaman
    static async getBorrowingById({
        params
    }: Context) {
        const result = await BorrowingService.getBorrowingById(Number(params.id));
        return { success: true, data: result };
    }

    // admin menyetujui pinjaman
    static async approveBorrowing({
        params
    }: Context) {
        const result = await BorrowingService.approveBorrowing(Number(params.id));
        return { success: true, message: "Pinjaman berhasil disetujui", data: result };
    }

    // admin menolak pinjaman
    static async rejectBorrowing({
        params
    }: Context) {
        const result = await BorrowingService.rejectBorrowing(Number(params.id));
        return { success: true, message: "Pinjaman ditolak", data: result };
    }

    // admin mengembalikan pinjaman
    static async returnBorrowing({
        params
    }: Context) {
        const result = await BorrowingService.returnBorrowing(Number(params.id));
        return { success: true, message: "Pinjaman berhasil dikembalikan", data: result };
    }

}