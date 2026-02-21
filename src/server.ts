import "./@types/elysia.d.ts";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AuthRoute } from "./routes/authRoute";
import { AuthOtpRoute } from "./routes/authRoute";
import { UserRoute } from "./routes/userRoute";
import { AdminRoute } from "./routes/adminRoute";
import { RefreshTokenRoute } from "./routes/refreshTokenRoute"
import { ForgotPasswordRoute } from "./routes/forgotPasswordRoute.ts";
import { ErrorMiddleware } from "./middlewares/errorMiddleware";
import { startOtpCleanerJob } from "./helper/otpCleanerJob";
import { swagger } from "@elysiajs/swagger";


startOtpCleanerJob();

const app = new Elysia()
    .use(ErrorMiddleware)
    .use(
        swagger({
            documentation: {
                info: {
                    title: "CRUD with Elysia, Bun and Prisma",
                    version: "1.0.0",
                    description: "Practice CRUD Backend API with JWT + OTP Login/Register"
                },
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT"
                        }
                    }
                }
            }
        })
    )
    .use(cors({
        origin: true,
        credentials: true
    }))
    .get("/", () => "Hello Jogja!")
    .get("/health", () => ({
        status: "OK"
    }))

    // routes
    .use(AuthRoute)
    .use(RefreshTokenRoute)
    .use(AuthOtpRoute)
    .use(ForgotPasswordRoute)
    .use(UserRoute)
    .use(AdminRoute)


export default app;