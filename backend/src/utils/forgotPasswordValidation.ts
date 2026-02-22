import { z } from "zod";

export class ForgotPasswordValidation {
    // request lupa password
    static readonly forgotPassword = z.object({ 
        email: z.string().email("Invalid email address") 
    });

    // request verifikasi otp lupa password
    static readonly verifyForgotOtp = z.object({
        email: z.string().email("Invalid email address"),
        code: z.string()
            .length(6, "OTP must be 6 digits")
            .regex(/^\d+$/, "OTP must be numeric"),
    });

    // request reset password
    static readonly resetPassword = z.object({
        email: z.string().email("Invalid email address"),
        code: z.string()
            .length(6, "OTP must be 6 digits")
            .regex(/^\d+$/, "OTP must be numeric"),
        newPassword: z.string()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(255, { message: "Password must be at most 255 characters long" })
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
            ),
        confirmNewPassword: z.string()
    });
}