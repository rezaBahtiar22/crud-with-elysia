import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthOtpController } from "../controllers/authOtpController";
import { LoginRateLimit } from "../middlewares/rateLimiter";

// route untuk auth user
export const AuthRoute = new Elysia({ prefix: "/auth" })
    // register user
    .post("/register", async ({ body, set }) => {
        set.status = 201;
        return AuthController.register(body);
    },{
        tags: ["Auth Register new User"],
        summary: "Register a new user",
        body: t.Object({
            name: t.String(),
            email: t.String(),
            password: t.String()
        })
    })
    // login user
    .post("/login", async (ctx) => {
        ctx.set.status = 200;
        await LoginRateLimit(ctx);
        return AuthController.login(ctx.body);
    }, {
        tags: ["Auth Login User"],
        summary: "Login user with email and password",
        body: t.Object({
            email: t.String(),
            password: t.String()
        })
    })


// route untuk auth otp
export const AuthOtpRoute = new Elysia({ prefix: "/auth/otp" })
    // req otp register
    .post("/register", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.requestOtpRegister(body);
    }, {
        tags: ["Auth OTP Register"],
        summary: "Register a new user with otp",
        body: t.Object({
            email: t.String(),
        })
    })

    // verify register otp
    .post("/register/verify", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.verifyRegisterOtp(body);
    }, {
        tags: ["Auth verify OTP Register"],
        summary: "Verify OTP for registering a new user",
        body: t.Object({
            email: t.String(),
            code: t.String(),
            name: t.String()
        })
    })

    // req otp login
    .post("/login", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.requestOtpLogin(body);
    }, {
        tags: ["Auth OTP Login"],
        summary: "Login user with otp",
        body: t.Object({
            email: t.String()
        })
    })

    // verify otp login
    .post("/login/verify", async ({ body, set }) => {
        set.status = 200;
        return AuthOtpController.verifyOtpLogin(body);
    }, {
        tags: ["Auth verify OTP Login"],
        summary: "Verify OTP for login user",
        body: t.Object({
            email: t.String(),
            code: t.String()
        })
    })