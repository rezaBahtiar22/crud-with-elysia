import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AuthRoute } from "./routes/authRoute";
import { AuthOtpRoute } from "./routes/authRoute";
import { UserRoute } from "./routes/userRoute";
import { ErrorMiddleware } from "./middlewares/errorMiddleware";
import { startOtpCleanerJob } from "./helper/otpCleanerJob";


startOtpCleanerJob();

const app = new Elysia()
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