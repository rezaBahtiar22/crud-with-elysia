import Elysia, { t } from "elysia";
import { AdminBookController } from "../controllers/adminBookController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import type { AuthContext } from "../@types/context";

// Route buku untuk user biasa (hanya read)
export const UserBookRoute = new Elysia({ prefix: "/books" })

    // get all books (dengan pagination, search, filter kategori)
    .get("/", async (context) => {
        context.set.status = 200;
        return AdminBookController.bookPagination(context as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Books"],
            summary: "Get all books (User & Admin)",
            security: [{ bearerAuth: [] }]
        },
        query: t.Object({
            page:     t.Optional(t.Number()),
            limit:    t.Optional(t.Number()),
            search:   t.Optional(t.String()),
            category: t.Optional(t.String()),
        })
    })

    // get book by id
    .get("/:id", async ({ params, set }) => {
        set.status = 200;
        return AdminBookController.getBookById(Number(params.id));
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Books"],
            summary: "Get book by id (User & Admin)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
