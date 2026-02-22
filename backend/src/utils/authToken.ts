import crypto from "crypto";
import { prisma } from "../database/prisma"
import { generateToken } from "./jwt"
import type { User } from "../../generated/prisma/client"

export async function issueAuthTokens(user: User) {
    const accessToken = generateToken({
        id: user.id,
        role: user.role
    });

    const refreshToken = crypto.randomBytes(32).toString("hex");

    const hashedRefreshToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokens: hashedRefreshToken,
            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )
        }
    });

    return {
        accessToken,
        refreshToken
    }
}