// request refresh token
export interface AuthRefreshTokenRequest {
    refreshToken: string
}

// response refresh token
export interface AuthRefreshTokenResponse {
    message: string
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

// mapper untuk response refresh token
export function toAuthRefreshTokenResponse(
    accessToken: string,
    refreshToken: string
): AuthRefreshTokenResponse {
    return {
        message: "Token refreshed successfully",
        tokens: {
            accessToken,
            refreshToken
        }
    };
}