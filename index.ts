import { Elysia } from "elysia";

const app = new Elysia()
    .get("/", () => "Hello Jogja!")


export default app;