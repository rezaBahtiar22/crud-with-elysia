import { Elysia, t } from "elysia";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { RoleMiddleware } from "../middlewares/roleMiddleware";
import { AdminUserController } from "../controllers/adminController";

export const AdminRoute = new Elysia({ prefix: "/admin" })
    .use(AuthMiddleware)
    .get("/users", AdminUserController.getUsers, {
        beforeHandle: RoleMiddleware(["ADMIN"]),

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