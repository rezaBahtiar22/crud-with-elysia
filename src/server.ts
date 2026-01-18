import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AuthRoute } from "./routes/authRoute";
import { UserRoute } from "./routes/userRoute";
import { ErrorMiddleware } from "./middlewares/errorMiddleware";


const app = new Elysia()
    .use(cors({
        origin: true,
        credentials: true
    }))
    .get("/", () => "Hello Jogja!")
    .use(AuthRoute)
    .use(UserRoute)
    .use(ErrorMiddleware)


export default app;