import { RateLimiterMemory } from "rate-limiter-flexible";
import { ResponseError } from "../utils/responseError";
import type { Context } from "elysia";

// rate limiter
const loginRateLimiter = new RateLimiterMemory({
    points: 3,         // 3 requests
    duration: 180,     // per 3 minutes
});

// fungsi untuk rate limiter
export async function LoginRateLimit(ctx: Context & { ip?: string }) {
    const ip =
        ctx.request.headers.get("x-forwarded-for") ||
        ctx.request.headers.get("cf-connecting-ip") ||
        (ctx as any).ip || "unknown";

    const email = (ctx.body as any)?.email || "unknown";

    const key = `${ip}_${email}`;

        try {
            await loginRateLimiter.consume(key);
        } catch {
            throw new ResponseError(
                429,
                "Too_Many_Requests",
                "Too many requests, please try again later in 3 minutes"
            );
        }
}
