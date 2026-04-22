import { cleanOtpExpired, cleanExpiredRefreshTokens } from "../utils/cleanup";

export function startCronJobs() {
    // Run every 5 minutes
    setInterval(async () => {
        try {
            await Promise.all([
                cleanOtpExpired(),
                cleanExpiredRefreshTokens()
            ]);
            console.log("✅ Background cleanup: Expired OTP and RefreshTokens cleared.");
        } catch (err) {
            console.error("❌ Background cleanup error:", err);
        }
    }, 5 * 60 * 1000);
};
