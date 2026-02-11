import { Elysia, t } from "elysia"
import { RefreshTokenController } from "../controllers/refreshTokenController"

export const RefreshTokenRoute = new Elysia({ prefix: "/auth" })
    .post("/refresh", async (ctx) => {
        return RefreshTokenController.refresh(ctx.body);
    },
    {
        detail: {
            tags: ["Auth"],
            summary: "Refresh access token"
        },
        body: t.Object({
            refreshToken: t.String()
        })
    }
)
