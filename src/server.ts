import "./@types/elysia.d.ts";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AuthRoute } from "./routes/authRoute";
import { AuthOtpRoute } from "./routes/authRoute";
import { UserRoute } from "./routes/userRoute";
import { ErrorMiddleware } from "./middlewares/errorMiddleware";
import { startOtpCleanerJob } from "./helper/otpCleanerJob";
import { swagger } from "@elysiajs/swagger";


startOtpCleanerJob();

const app = new Elysia()
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

    // routes
    .use(AuthRoute)
    .use(AuthOtpRoute)
    .use(UserRoute)

    // middleware error handler
    .use(ErrorMiddleware)


export default app;