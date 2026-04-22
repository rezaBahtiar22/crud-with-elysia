import { prisma } from "../database/prisma"

// clean expired otp and used ones
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

// clean expired refresh tokens
export async function cleanExpiredRefreshTokens() {
    await prisma.refreshToken.deleteMany({
        where: {
            expiresAt: { lt: new Date() }
        }
    });
}
