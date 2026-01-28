import { cleanOtpExpired } from "../utils/otpCleaner";

export function startOtpCleanerJob() {
    setInterval(async () => {
        try {
            await cleanOtpExpired();
            console.log("Cleaned expired OTP");
        } catch (err) {
            console.error("OTP Cleaner Error:", err);
        }
    }, 3 * 60 * 1000);
};