import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { ResponseError } from "../utils/responseError";

// route untuk user
export const UserRoute = new Elysia({ prefix: "/user" })
    .use(AuthMiddleware)
    // logout user
    .post("/logout", (ctx) => {
        if (!ctx.user || !ctx.token) {
            throw new ResponseError(
                401, 
                "Unauthorized", 
                "Authentication is required"
            );
        }
        return AuthController.logout(ctx.user, ctx.token);
    })