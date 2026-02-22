import { RefreshTokenService } from "../services/refreshTokenService";
import type { AuthRefreshTokenRequest } from "../interfaces/refreshTokens"

export class RefreshTokenController {
    static async refresh(
        body: AuthRefreshTokenRequest
    ) {
        return RefreshTokenService.refreshToken(body.refreshToken)
    }
}