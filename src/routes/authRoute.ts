import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import type { AuthUserRegisterRequest } from "../interfaces/authUserRegister";
import type { AuthUserLoginRequest } from "../interfaces/authUserLogin";

// route untuk auth user
export const AuthRoute = new Elysia({ prefix: "/auth" })
    // register user
    .post("/register", async ({ body, set }) => {
        set.status = 201;
        return AuthController.register(body as AuthUserRegisterRequest);
    })
    // login user
    .post("/login", async ({ body, set }) => {
        set.status = 200;
        return AuthController.login(body as AuthUserLoginRequest);
    })