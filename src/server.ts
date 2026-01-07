import { Elysia } from "elysia";
import { AuthRoute } from "./routes/authRoute";
import { ErrorMiddleware } from "./middlewares/errorMiddleware";


const app = new Elysia()
    .get("/", () => "Hello Jogja!")
    .use(AuthRoute)
    .use(ErrorMiddleware);


export default app;