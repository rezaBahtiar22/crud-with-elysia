import { prisma } from "../database/prisma";
import type { ForgotPasswordRequest, ForgotPasswordResponse } from "../interfaces/requestForgotPassword";
import type { VerifyForgotOtpRequest, VerifyForgotOtpResponse } from "../interfaces/verifyForgotPassword";
import type { ResetPasswordRequest, ResetPasswordResponse } from "../interfaces/resetPassword";
import { ResponseError } from "../utils/responseError";
import { ForgotPasswordValidation } from "../utils/forgotPasswordValidation";
import * as argon2 from "argon2";
import { Validation } from "../utils/validation";
import { generateOTP, generateOtpExpired } from "../utils/otp";
import { sendOTPEmail } from "../utils/mailer";


export class ForgotPassword {

    // service untuk request lupa password
    static async reqForgotPassword(
        request: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> {
        // validasi request body
        const data = Validation.validate<ForgotPasswordRequest>(ForgotPasswordValidation.forgotPassword, request);

        // cek user ada atau tidak
        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        // jika user tidak ditemukan, lempar error
        if (!user) {
            throw new ResponseError(
                404,
                "Not_Found",
                "User not found"
            );
        }

        // generate OTP
        const code = generateOTP();
        const expiresAt = generateOtpExpired();

        await prisma.emailOTP.create({
            data: {
                email: user.email,
                code,
                purpose: "RESET_PASSWORD",
                expiresAt,
                attempts: 0
            }
        });

        // kirim email otp
        await sendOTPEmail(user.email, code);

        return {
            message: "OTP has been sent to your email"
        }
    }

    // service untuk verifikasi otp lupa password
    static async verifyForgotOTP(
        request: VerifyForgotOtpRequest
    ): Promise<VerifyForgotOtpResponse> {
        // validasi request body
        const data = Validation.validate<VerifyForgotOtpRequest>(ForgotPasswordValidation.verifyForgotOtp, request);

        // cari otp di db
        const otpRecord = await prisma.emailOTP.findFirst({
            where: {
                email: data.email,
                code: data.code,
                purpose: "RESET_PASSWORD",
                used: false,
                expiresAt: { gt: new Date() } // otp belum expired
            }
        });

        // cek jika otp tidak ditemukan
        if (!otpRecord) {
            throw new ResponseError(
                400,
                "Invalid_OTP",
                "The provided OTP is invalid or has expired"
            );
        }

        // cek jika belum expired
        if (otpRecord.expiresAt < new Date()) {
            throw new ResponseError(
                400,
                "Invalid_OTP",
                "The provided OTP is invalid or has expired"
            );
        }

        return {
            message: "OTP verified successfully"
        }
    }

    // service untuk reset password
    static async resetPassword(
        request: ResetPasswordRequest
    ): Promise<ResetPasswordResponse> {
        // validasi request body
        const data = Validation.validate<ResetPasswordRequest>(ForgotPasswordValidation.resetPassword, request);

        // cek otp valid
        await this.verifyForgotOTP({
            email: data.email,
            code: data.code
        });

        // update user password
        const hashedPassword = await argon2.hash(data.newPassword);

        // update password user di db
        await prisma .user.update({
            where: { email: data.email },
            data: { password: hashedPassword }
        });

        // hapus otp setelah digunakan
        await prisma.emailOTP.deleteMany({
            where: {
                email: data.email,
                purpose: "RESET_PASSWORD"
            }
        });

        return {
            message: "Password has been reset successfully"
        }
    }

}