import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { ResponseError } from "../utils/responseError";
import type { AuthUserUpdatePasswordRequest } from "../interfaces/authUserUpdatePassword";

// route untuk user
export const UserRoute = new Elysia({ prefix: "/user" })
    .use(AuthMiddleware)
    // logout user
    .post("/logout", (ctx) => {
        return AuthController.logout(ctx.user as any, ctx.token as any);
    })

    // update user profile(username dan email)
    .patch("/update/profile", async ({ body, user }) => {
        // guard untuk cek jika user tidak ditemukan
        if (!user) {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Authentication is required"
            )
        }

        // guard untuk cek jika body tidak ditemukan
        if (!body) {
            throw new ResponseError(
                400,
                "Bad Request",
                "Request body is required"
            )
        }
        return AuthController.updateProfile(user, body);
    })

    // untuk user update password
    .patch("/update/password", async (ctx) => {
        if (!ctx.user) {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Authentication is required"
            )
        }

        return AuthController.updatePassword(
            ctx.user,
            ctx.body as AuthUserUpdatePasswordRequest
        )
    })

    // get profile / auth me
    .get("/profile", async ({ user, set }) => {
        set.status = 200;
        return AuthController.profile(user!);
    })