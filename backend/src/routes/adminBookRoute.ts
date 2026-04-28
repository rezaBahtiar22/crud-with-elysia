import { Elysia, t } from "elysia";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { RoleMiddleware } from "../middlewares/roleMiddleware";
import { AdminBookController } from "../controllers/adminBookController";
import type { BookDataRequest } from "../interfaces/BookInterface/adminAddBook";
import type { AdminUpdateBookRequest } from "../interfaces/BookInterface/adminUpdateBook";


export const AdminBookRoute = new Elysia({ prefix: "/admin" })

    // get all books
    .get("/books", async (context) => {
        context.set.status = 200;
        return AdminBookController.bookPagination(context as any);
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Admin Get All Books"],
            summary: "Get all books (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        query: t.Object({
            page: t.Optional(t.Number()),
            limit: t.Optional(t.Number()),
            search: t.Optional(t.String()),
            category: t.Optional(t.String())
        })
    })

    // get book by id
    .get("/books/:id", async ({ params, set }) => {
        set.status = 200;
        return AdminBookController.getBookById(Number(params.id));
    }, {
        beforeHandle: [
            AuthMiddleware,
        ],
        detail: {
            tags: ["Admin Get Book By Id"],
            summary: "Get book by id (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })

    // add new book
    .post("/books", async ({ body, set }) => {
        set.status = 201;
        return AdminBookController.addBook(body as BookDataRequest);
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Add Book"],
            summary: "Add book (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        body: t.Object({
            title:          t.String(),
            author:         t.String(),
            isbn:           t.String(),
            publisher:      t.Optional(t.String()),
            year:           t.Optional(t.Any()), // Gunakan Any karena FormData mengirim string
            category:       t.Optional(t.String()),
            description:    t.Optional(t.String()),
            readLink:       t.Optional(t.Union([t.String(), t.Null()])),
            bookFile:       t.Optional(t.Any()), // Menampung File
            cover:          t.Optional(t.Union([t.String(), t.Null()])),
            stock:          t.Optional(t.Any())
        })
    })

    // edit book
    .patch("/books/:id", async ({ params, body, set }) => {
        set.status = 200;
        return AdminBookController.updateBook(
            Number(params.id), 
            body as AdminUpdateBookRequest
        );
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Update Book"],
            summary: "Update book (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        body: t.Object({
            title:          t.Optional(t.String()),
            author:         t.Optional(t.String()),
            isbn:           t.Optional(t.String()),
            publisher:      t.Optional(t.String()),
            year:           t.Optional(t.Any()),
            category:       t.Optional(t.String()),
            description:    t.Optional(t.String()),
            readLink:       t.Optional(t.Union([t.String(), t.Null()])),
            bookFile:       t.Optional(t.Any()),
            cover:          t.Optional(t.Union([t.String(), t.Null()])),
            stock:          t.Optional(t.Any())
        })
    })

    // delete book
    .delete("/books/:id", async ({ params, set }) => {
        set.status = 200;
        return AdminBookController.deleteBook(Number(params.id));
    }, {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],
        detail: {
            tags: ["Admin Delete Book"],
            summary: "Delete book (Admin only)",
            security: [{ bearerAuth: [] }]
        },
        params: t.Object({
            id: t.Number()
        })
    })
