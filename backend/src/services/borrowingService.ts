import { prisma } from "../database/prisma";
import { BorrowingStatus } from "../../generated/prisma";
import { ResponseError } from "../utils/responseError";

import type {
    CreateBorrowingRequest,
    BorrowingPaginationQuery
} from "../interfaces/borrowing/borrowingDto";

import type { 
    BorrowingPaginationResponse, 
    BorrowingResponse 
} from "../interfaces/borrowing/borrowingResponse";

import { 
    toBorrowingResponse, 
    toBorrowingPaginationResponse 
} from "../interfaces/borrowing/borrowingMapper";


// denda keterlambatan per hari
const FINE_PER_DAY = 1000;

const borrowingInclude = {
    user: { select: { id: true, name: true, email: true } },
    book: { select: { id: true, title: true, author: true, cover: true, isbn: true } }
}

export class BorrowingService {

    // user ajukan peminjaman
    static async CreateBorrowing(
        userId: number,
        body: CreateBorrowingRequest
    ): Promise<BorrowingResponse> {
        // cek buku
        const book = await prisma.book.findFirst({
            where: {
                id: body.bookId,
                deletedAt: null
            },
        });

        if (!book) {
            throw new ResponseError(
                404,
                "Book_Not_Found",
                "Buku tidak ditemukan"
            );
        }

        // cek stok buku
        if (book.availableStock <= 0) {
            throw new ResponseError(
                400,
                "Book_Not_Avaliable",
                "Buku tidak tersedia"
            );
        }

        // cek apakah user sudah meminjam buku yang sama dan belum dikembalikan
        const existing = await prisma.borrowing.findFirst({
            where: {
                userId,
                bookId: body.bookId,
                status: { in: [BorrowingStatus.PENDING, BorrowingStatus.APPROVED] },
            },
        });

        if (existing) {
            throw new ResponseError(
                409,
                "Book_Already_Borrowing",
                "Anda sudah meminjam atau mengajukan peminjaman buku ini"
            );
        }

        // validasi dueData
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);  // 14 hari
        if (isNaN(dueDate.getTime()) || dueDate <= new Date()) {
            throw new ResponseError(
                400,
                "Invalid_Due_Date",
                "Tanggal pengembalian tidak valid"
            );
        }

        // buat peminjaman baru
        const borrowing = await prisma.borrowing.create({
            data: {
                userId,
                bookId: body.bookId,
                dueDate,
                status: BorrowingStatus.PENDING,
            },
            include: borrowingInclude,
        });

        return toBorrowingResponse(borrowing);
    }

    // user lihat pinjaman sendiri
    static async getUserBorrowing(
        userId: number,
        query: BorrowingPaginationQuery
    ): Promise<BorrowingPaginationResponse> {
        // Otomatis sinkronkan status terlambat sebelum ambil data
        await BorrowingService.updateOverdueStatus();

        const page = query.page ?? 1;
        const limit = query.limit ?? 5;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (query.status) where.status = query.status;

        const [totalItems, borrowings] = await Promise.all([
            prisma.borrowing.count({ where }),
            prisma.borrowing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: borrowingInclude,
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        return toBorrowingPaginationResponse(
            borrowings, { 
                page, 
                limit, 
                totalItems, 
                totalPages 
            }
        );
    }

    // user melihat detail peminjaman
    static async getBorrowingById(
        id: number,
        userId?: number
    ): Promise<BorrowingResponse> {
        const where: any = { id };
        if (userId) where.userId = userId;

        const borrowing = await prisma.borrowing.findFirst({
            where,
            include: borrowingInclude,
        });

        if (!borrowing) {
            throw new ResponseError(
                404,
                "Borrowing_Not_Found",
                "Peminjaman tidak ditemukan"
            );
        }

        return toBorrowingResponse(borrowing);
    }

    // admin dapat melihat semua pinjaman
    static async getAllBorrowings(
        query: BorrowingPaginationQuery
    ): Promise<BorrowingPaginationResponse> {
        // Otomatis sinkronkan status terlambat sebelum ambil data
        await BorrowingService.updateOverdueStatus();

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { user: { name: { contains: query.search, mode: "insensitive" } } },
                { book: { title: { contains: query.search, mode: "insensitive" } } },
            ];
        }

        const [totalItems, borrowings] = await Promise.all([
            prisma.borrowing.count({ where }),
            prisma.borrowing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: borrowingInclude,
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        return toBorrowingPaginationResponse(borrowings, {
            page,
            limit,
            totalItems,
            totalPages,
        });
    }

    // admin menyetujui peminjaman
    static async approveBorrowing(
        id: number
    ): Promise<BorrowingResponse> {
        const borrowing = await prisma.borrowing.findFirst({
            where: { id },
            include: borrowingInclude,
        });

        if (!borrowing) {
            throw new ResponseError(
                404,
                "Borrowing_Not_Found",
                "Peminjaman tidak ditemukan"
            );
        }

        if (borrowing.status !== BorrowingStatus.PENDING) {
            throw new ResponseError(
                400,
                "Invalid_Status",
                "Hanya peminjaman berstatus PENDING yang bisa di-approve"
            );
        }

        // cek stok lagi sebelum menyetujui
        const book = await prisma.book.findFirst({
            where: {
                id: borrowing.bookId,
                deletedAt: null,
            }
        });

        if (!book || book.availableStock <= 0) {
            throw new ResponseError(
                400,
                "Book_Not_Available",
                "Stok buku tidak tersedia"
            );
        }

        // setujui + kurangi stok buku
        const [updated] = await prisma.$transaction([
            prisma.borrowing.update({
                where: { id },
                data: { status: BorrowingStatus.APPROVED },
                include: borrowingInclude, 
            }),
            prisma.book.update({
                where: {
                    id: borrowing.bookId
                },
                data: {
                    availableStock: { decrement: 1 },
                }
            }),
        ]);

        return toBorrowingResponse(updated);
    }

    // admin reject pinjaman
    static async rejectBorrowing(
        id: number
    ): Promise<BorrowingResponse> {
        const borrowing = await prisma.borrowing.findFirst({
            where: { id },
            include: borrowingInclude,
        });

        if (!borrowing) {
            throw new ResponseError(
                404,
                "Borrowing_Not_Found",
                "Peminjaman tidak ditemukan"
            );
        }

        if (borrowing.status !== BorrowingStatus.PENDING) {
            throw new ResponseError(
                400,
                "Invalid_Status",
                "Hanya peminjaman berstatus PENDING yang bisa di-reject"
            );
        }

        const updated = await prisma.borrowing.update({
            where: { id },
            data: { status: BorrowingStatus.REJECTED },
            include: borrowingInclude,
        });

        return toBorrowingResponse(updated);
    }

    // admin return buku
    static async returnBorrowing(
        id: number
    ): Promise<BorrowingResponse> {
        const borrowing = await prisma.borrowing.findFirst({
            where: { id },
            include: borrowingInclude,
        });

        if (!borrowing) {
            throw new ResponseError(
                404,
                "Borrowing_Not_Found",
                "Peminjaman tidak ditemukan"
            );
        }

        if (borrowing.status !== BorrowingStatus.APPROVED && borrowing.status !== BorrowingStatus.OVERDUE) {
            throw new ResponseError(
                400,
                "Invalid_Status",
                "Hanya peminjaman berstatus APPROVED atau OVERDUE yang bisa di-return"
            );
        }

        // hitung data
        const now = new Date();
        const dueData = new Date(borrowing.dueDate);
        let fine = 0;

        if (now > dueData) {
            const daysLate = Math.ceil((now.getTime() - dueData.getTime()) / (1000 * 60 * 60 * 24));
            fine = daysLate * FINE_PER_DAY;
        }

        // return dan tambah stok 
        const [updated] = await prisma.$transaction([
            prisma.borrowing.update({
                where: { id },
                data: {
                    status: BorrowingStatus.RETURNED,
                    returnedAt: now,
                    fine,
                },
                include: borrowingInclude,
            }),
            prisma.book.update({
                where: {
                    id: borrowing.bookId
                },
                data: {
                    availableStock: { increment: 1 },
                }
            }),
        ]);

        return toBorrowingResponse(updated);
    }

    // update status overdue
    static async updateOverdueStatus(): Promise<number> {
        const result = await prisma.borrowing.updateMany({
            where: {
                status: BorrowingStatus.APPROVED,
                dueDate: { lt: new Date() },
            },
            data: {
                status: BorrowingStatus.OVERDUE,
            },
        });

        return result.count;
    }

}
