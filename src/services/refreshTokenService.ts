import { prisma } from "../database/prisma"
import type { AuthRefreshTokenResponse } from "../interfaces/refreshTokens"
import { ResponseError } from "../utils/responseError"
import crypto from "crypto"
import { toAuthRefreshTokenResponse } from "../interfaces/refreshTokens"
import { generateToken } from "../utils/jwt"
import { issueAuthTokens } from "../utils/authToken"

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

        const user = existingToken.user;

        // cek jika token sudah expired
        if (user.deletedAt) {

            // 
            await prisma.refreshToken.deleteMany({
                where: { userId: user.id }
            });

            throw new ResponseError(
                401,
                "Unauthorized",
                "User account is deactivated"
            );
        }

        // cek expire
        if (existingToken.expiresAt < new Date()) {

            await prisma.refreshToken.delete({
                where: { id: existingToken.id }
            });

            throw new ResponseError(
                403,
                "Expred_Refresh_Token",
                "The provided refresh token is expired"
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
        const tokens = await issueAuthTokens(user);

        return toAuthRefreshTokenResponse(
            tokens.accessToken,
            tokens.refreshToken
        )
    }
}