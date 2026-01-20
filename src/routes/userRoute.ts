import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { ResponseError } from "../utils/responseError";

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