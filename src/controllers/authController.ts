import { AuthService } from "../services/authUserService";
import type { AuthUserRegisterRequest, AuthUserRegisterResponse } from "../interfaces/authUserRegister";
import type { AuthUserLoginRequest, AuthUserLoginResponse } from "../interfaces/authUserLogin";
import type { AuthUserUpdateRequest, AuthUserUpdateResponse } from "../interfaces/authUserUpdateProfile";
import type { AuthUserUpdatePasswordRequest, AuthUserUpdatePasswordResponse } from "../interfaces/authUserUpdatePassword";
import type { AuthMeResponse } from "../interfaces/authMeData";

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
        user:{ id: number, role: string }, 
        body: AuthUserUpdateRequest
    ): Promise<AuthUserUpdateResponse> {
        return AuthService.updateProfile(user, body);
    }

    // controller untuk user update password
    static async updatePassword(
        user:{ id: number, role: string }, 
        body: AuthUserUpdatePasswordRequest
    ): Promise<AuthUserUpdatePasswordResponse> {
        return AuthService.updatePassword(user, body);
    }

    // controller untuk logout user
    static async logout(
        body: { refreshToken: string }
    ) {
        return AuthService.logout(body.refreshToken);
    }

    // controller untuk get me
    static async profile(
        user: { id: number }
    ): Promise<AuthMeResponse> {
        
        return AuthService.profile(user);
    }
}