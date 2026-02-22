import { AuthOtpService } from "../services/authOtpService";

import type { 
    AuthOtpLoginRequest, 
    AuthOtpVerifyLoginRequest
} from "../interfaces/authOtpLogin"

import type {
    AuthRegisterOtpRequest,
    AuthVerifyRegisterOtpRequest
} from "../interfaces/authOtpRegister"

export class AuthOtpController {

    // req otp login
    static async requestOtpLogin(body: AuthOtpLoginRequest) {
        return AuthOtpService.requestOtpLogin(body);
    }

    // verify otp login
    static async verifyOtpLogin(body: AuthOtpVerifyLoginRequest) {
        return AuthOtpService.verifyOtpLogin(body);
    }

    // req otp register
    static async requestOtpRegister(body: AuthRegisterOtpRequest) {
        return AuthOtpService.requestOtpRegister(body);
    }

    // verify otp register
    static async verifyRegisterOtp(body: AuthVerifyRegisterOtpRequest) {
        return AuthOtpService.verifyRegisterOtp(body);
    }

};