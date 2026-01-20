import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import type { AuthUserRegisterRequest } from "../interfaces/authUserRegister";
import type { AuthUserLoginRequest } from "../interfaces/authUserLogin";
import { LoginRateLimit } from "../middlewares/rateLimiter";

// route untuk auth user
export const AuthRoute = new Elysia({ prefix: "/auth" })
    // register user
    .post("/register", async ({ body, set }) => {
        set.status = 201;
        return AuthController.register(body as AuthUserRegisterRequest);
    })
    // login user
    .post("/login", async (ctx) => {
        ctx.set.status = 200;
        await LoginRateLimit(ctx);
        return AuthController.login(ctx.body as AuthUserLoginRequest);
    })