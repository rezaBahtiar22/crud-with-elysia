import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import type { AuthUserRegisterRequest } from "../interfaces/authUserRegister";
import type { AuthUserLoginRequest } from "../interfaces/authUserLogin";
import { AuthOtpController } from "../controllers/authOtpController";
import type { AuthRegisterOtpRequest, AuthVerifyRegisterOtpRequest } from "../interfaces/authOtpRegister";
import type { AuthOtpLoginRequest, AuthOtpVerifyLoginRequest } from "../interfaces/authOtpLogin";
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


// route untuk auth otp
export const AuthOtpRoute = new Elysia({ prefix: "auth/otp" })
    // req otp register
    .post("/register", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.requestOtpRegister(body as AuthRegisterOtpRequest);
    })

    // verify register otp
    .post("/register/verify", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.verifyRegisterOtp(body as AuthVerifyRegisterOtpRequest);
    })

    // req otp login
    .post("/login", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.requestOtpLogin(body as AuthOtpLoginRequest);
    })

    // verify otp login
    .post("/login/verify", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.verifyOtpLogin(body as AuthOtpVerifyLoginRequest);
    })