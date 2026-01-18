import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";

// route untuk user
export const UserRoute = new Elysia({ prefix: "/user" })
    .use(AuthMiddleware)
    // logout user
    .post("/logout", (ctx) => {
        // console.log("CTX USER:", ctx.user);
        // console.log("CTX TOKEN:", ctx.token);

        return AuthController.logout(ctx.user as any, ctx.token as any);
    })