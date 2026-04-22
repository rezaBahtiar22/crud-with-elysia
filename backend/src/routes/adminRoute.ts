import { Elysia, t } from "elysia";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { RoleMiddleware } from "../middlewares/roleMiddleware";
import { AdminUserController } from "../controllers/adminController";

export const AdminRoute = new Elysia({ prefix: "/admin" })
    // .use(AuthMiddleware)
    .get("/users", (context) => AdminUserController.getUsers(context as any), {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],

        detail: {
            tags: ["Admin Get All Users"],
            summary: "Get all users (Admin only)",
            security: [{ bearerAuth: [] }]
        },

        query: t.Object({
            page: t.Optional(t.Number()),
            limit: t.Optional(t.Number())
        })
    })

    .delete("/users/:id", (context) => AdminUserController.deleteUser(context as any), {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],

        detail: {
            tags: ["Admin Delete User"],
            summary: "Delete user (Admin only)",
            security: [{ bearerAuth: [] }]
        },

        params: t.Object({
            id: t.Number()
        })
    })

    .get("/user/:id", (context) => AdminUserController.getUserById(context as any), {
        beforeHandle: [
            AuthMiddleware,
            RoleMiddleware(["ADMIN"])
        ],

        detail: {
            tags: ["Admin Get User By Id"],
            summary: "Get user by id (Admin only)",
            security: [{ bearerAuth: [] }]
        },

        params: t.Object({
            id: t.Number()
        })
    })
