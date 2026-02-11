import { prisma } from "../database/prisma"
import type { AuthRefreshTokenResponse } from "../interfaces/refreshTokens"
import { ResponseError } from "../utils/responseError"
import crypto from "crypto"
import { toAuthRefreshTokenResponse } from "../interfaces/refreshTokens"
import { generateToken } from "../utils/jwt"

export class RefreshTokenService {

    static async refreshToken(
        refreshToken: string
    ): Promise<AuthRefreshTokenResponse> {
        if (!refreshToken) {
            throw new ResponseError(
                401,
                "Refresh_Token_Required",
                "Refresh token is required"
            );
        }

        // hash refresh token yang diterima
        const hashedToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // cari token di database
        const existingToken = await prisma.refreshToken.findUnique({
            where: { tokens: hashedToken },
            include: { user: true }
        });

        // jika token tidak ditemukan, lempar error
        if (!existingToken || !existingToken.user) {
            throw new ResponseError(
                403,
                "Invalid_Refresh_Token",
                "The provided refresh token is invalid"
            );
        }

        // cek jika token sudah expired
        if (existingToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({
                where: { id: existingToken.id }
            });

            throw new ResponseError(
                403,
                "Expired_Refresh_Token",
                "The provided refresh token has expired"
            );
        }

        // rotasi token: hapus token lama dan buat token baru
        await prisma.refreshToken.delete({
            where: { id: existingToken.id }
        });

        // buat access token baru
        const newAccessToken = generateToken({
            id: existingToken.user.id,
            role: existingToken.user.role
        });

        // buat refresh token baru
        const newRefreshToken = crypto.randomBytes(64).toString("hex");

        const hashedNewRefreshToken = crypto
            .createHash("sha256")
            .update(newRefreshToken)
            .digest("hex");

        await prisma.refreshToken.create({
            data: {
                userId: existingToken.user.id,
                tokens: hashedNewRefreshToken,
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                )
            }
        });

        return toAuthRefreshTokenResponse(newAccessToken, newRefreshToken)
    }
}