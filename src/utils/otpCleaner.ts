import { prisma } from "../database/prisma"

// clean expired otp
export async function cleanOtpExpired() {
    await prisma.emailOTP.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { used: true }
            ]
        }
    });
}