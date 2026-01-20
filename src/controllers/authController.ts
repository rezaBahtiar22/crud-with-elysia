import { AuthService } from "../services/authUserService";
import type { AuthUserRegisterRequest, AuthUserRegisterResponse } from "../interfaces/authUserRegister";
import type { AuthUserLoginRequest, AuthUserLoginResponse } from "../interfaces/authUserLogin";
import type { AuthUserUpdateRequest, AuthUserUpdateResponse } from "../interfaces/authUserUpdateProfile";

export class AuthController {
    // controller untuk register user
    static async register(
        body: AuthUserRegisterRequest
    ): Promise<AuthUserRegisterResponse> {
        return AuthService.register(body);
    }

    // controller untuk login user
    static async login(
        body: AuthUserLoginRequest
    ): Promise<AuthUserLoginResponse> {
        return AuthService.login(body);
    }

    // controller untuk user update profile
    static async updateProfile(
        user:{ userId: number, role: string }, 
        body: AuthUserUpdateRequest
    ): Promise<AuthUserUpdateResponse> {
        return AuthService.updateProfile(user, body);
    }

    // controller untuk logout user
    static async logout(
        user: { userId: string },
        token: string
    ) {
        return AuthService.logout(user, token);
    }
}