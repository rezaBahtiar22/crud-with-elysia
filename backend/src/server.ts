import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AuthRoute } from "./routes/authRoute.ts";
import { AuthOtpRoute } from "./routes/authRoute.ts";
import { UserRoute } from "./routes/userRoute.ts";
import { AdminRoute } from "./routes/adminRoute.ts";
import { RefreshTokenRoute } from "./routes/refreshTokenRoute.ts"
import { ForgotPasswordRoute } from "./routes/forgotPasswordRoute.ts";
import { ErrorMiddleware } from "./middlewares/errorMiddleware.ts";
import { startCronJobs } from "./helper/cronJobs.ts";
import { swagger } from "@elysiajs/swagger";
import { AdminBookRoute } from "./routes/adminBookRoute.ts";
import { AdminBorrowingRoute, BorrowingRoute } from "./routes/borrowingRoute.ts";
import { UserBookRoute } from "./routes/userBookRoute.ts";
import { loggerMiddleware } from "./middlewares/loggerMiddleware.ts";


startCronJobs();

const app = new Elysia()
    .use(ErrorMiddleware)
    .use(loggerMiddleware)
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
        origin: process.env.FRONTEND_URL || true,
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
    .use(AdminBookRoute)
    .use(UserBookRoute)
    .use(AdminBorrowingRoute)
    .use(BorrowingRoute)


export default app;
