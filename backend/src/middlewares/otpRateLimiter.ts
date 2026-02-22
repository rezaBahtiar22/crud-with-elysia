import { RateLimiterMemory } from "rate-limiter-flexible";
import { ResponseError } from "../utils/responseError";

// rate limiter
const otpRateLimiter = new RateLimiterMemory({
    points: 3,              // 3 requests
    duration: 180,          // per 3 minutes
});

export async function otpRateLimit(key: string) {
    try {
        await otpRateLimiter.consume(key);
    } catch {
        throw new ResponseError(
            429,
            "Too_Many_Requests",
            "Too many requests, please try again later in 3 minutes"
        );
    }
}