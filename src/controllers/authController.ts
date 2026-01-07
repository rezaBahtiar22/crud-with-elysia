import { AuthService } from "../services/authUserService";
import type { AuthUserRegisterRequest } from "../interfaces/authUserInterfaces";

export class AuthController {

    // controller untuk register user
    static async register(
        body: AuthUserRegisterRequest
    ) {
        return await AuthService.register(body);
    }

}