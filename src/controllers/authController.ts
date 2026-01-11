import { AuthService } from "../services/authUserService";
import type { AuthUserRegisterRequest } from "../interfaces/authUserRegister";
import type { AuthUserLoginRequest } from "../interfaces/authUserLogin";

export class AuthController {

    // controller untuk register user
    static async register(
        body: AuthUserRegisterRequest
    ) {
        return await AuthService.register(body);
    }

    // controller untuk login user
    static async login(body: AuthUserLoginRequest) {
        return await AuthService.login(body);
    }

    // controller untuk logout user
    static async logout(user: any) {
        return await AuthService.logout(user);
    }

}