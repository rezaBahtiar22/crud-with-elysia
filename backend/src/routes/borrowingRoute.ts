import { Elysia, t } from "elysia";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { RoleMiddleware } from "../middlewares/roleMiddleware";
import { BorrowingController } from "../controllers/borrowingController";


export const BorrowingRoute = new Elysia({ prefix: "/borrowing" })
 
    // Ajukan peminjaman
    .post("/", async ({ body, set, ...ctx }) => {
        set.status = 201;
        return BorrowingController.createBorrowing({ body, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Borrowing"],
            summary: "Ajukan peminjaman buku (User only)",
            security: [{ bearerAuth: [] }]
        },
        body: t.Object({
            bookId:  t.Number(),
        })
    })
 
    // Lihat peminjaman sendiri
    .get("/", async ({ query, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.getMyBorrowings({ query, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Borrowing"],
            summary: "Lihat peminjaman sendiri (User only)",
            security: [{ bearerAuth: [] }]
        },
        query: t.Object({
            page:   t.Optional(t.Number()),
            limit:  t.Optional(t.Number()),
            status: t.Optional(t.String()),
        })
    })
 
    // Detail peminjaman sendiri
    .get("/:id", async ({ params, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.getMyBorrowingById({ params, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Borrowing"],
            summary: "Detail peminjaman sendiri (User only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
 
 
// ── ADMIN ROUTES ──
export const AdminBorrowingRoute = new Elysia({ prefix: "/admin" })
 
    .get("/borrowing", async ({ query, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.getAllBorrowings({ query, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Borrowing"],
            summary: "Lihat semua peminjaman (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        query: t.Object({
            page:   t.Optional(t.Number()),
            limit:  t.Optional(t.Number()),
            status: t.Optional(t.String()),
            search: t.Optional(t.String()),
        })
    })
 
    // Detail peminjaman (any user)
    .get("/borrowing/:id", async ({ params, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.getBorrowingById({ params, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Borrowing"],
            summary: "Detail peminjaman (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
 
    // Approve peminjaman
    .patch("/borrowing/:id/approve", async ({ params, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.approveBorrowing({ params, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Borrowing"],
            summary: "Approve peminjaman (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
 
    // Reject peminjaman
    .patch("/borrowing/:id/reject", async ({ params, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.rejectBorrowing({ params, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Borrowing"],
            summary: "Reject peminjaman (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
 
    // Return buku
    .patch("/borrowing/:id/return", async ({ params, set, ...ctx }) => {
        set.status = 200;
        return BorrowingController.returnBorrowing({ params, set, ...ctx } as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Borrowing"],
            summary: "Kembalikan buku (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
