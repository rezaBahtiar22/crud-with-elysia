import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import type { AuthUserRegisterRequest } from "../interfaces/authUserInterfaces";

// route untuk auth user
export const AuthRoute = new Elysia({ prefix: "/auth" })
    // register user
    .post("/register", async ({ body, set }) => {
        set.status = 201;
        return AuthController.register(body as AuthUserRegisterRequest);
    })