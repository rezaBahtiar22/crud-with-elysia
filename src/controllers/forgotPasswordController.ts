import { ForgotPassword } from "../services/forgotPasswordService";
import type { ForgotPasswordRequest, ForgotPasswordResponse } from "../interfaces/requestForgotPassword";
import type { VerifyForgotOtpRequest, VerifyForgotOtpResponse } from "../interfaces/verifyForgotPassword";
import type { ResetPasswordRequest, ResetPasswordResponse } from "../interfaces/resetPassword";

export class ForgotPasswordController {
    // controller untuk request lupa password
    static async requestOtp(
        body: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> {
        return ForgotPassword.reqForgotPassword(body);
    }

    // controller untuk verifikasi otp lupa password
    static async verifyOtp(
        body: VerifyForgotOtpRequest
    ): Promise<VerifyForgotOtpResponse> {
        return ForgotPassword.verifyForgotOTP(body);
    }

    // controller untuk reset password
    static async resetPassword(
        body: ResetPasswordRequest
    ): Promise<ResetPasswordResponse> {
        return ForgotPassword.resetPassword(body);
    }
}