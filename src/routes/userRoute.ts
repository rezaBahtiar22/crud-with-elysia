import { Elysia } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { toAuthUserLogoutResponse } from "../interfaces/AuthUserLogout";

// route untuk user
export const UserRoute = new Elysia({ prefix: "/user" })
    .use(AuthMiddleware)
    // logout user
    .post("/logout", async ({ token, set }) => {
        set.status = 200;
        return AuthController.logout(token);
    });