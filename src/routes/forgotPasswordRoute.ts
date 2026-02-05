import { Elysia, t }from 'elysia'
import { ForgotPasswordController } from '../controllers/forgotPasswordController'

export const ForgotPasswordRoute = new Elysia({ prefix: "/auth" })
    // request otp forgot password
    .post("/forgot-password", ({ body }) => {
        return ForgotPasswordController.requestOtp(body);
    }, {
        tags: ["Forgot Password"],
        summary: "Request OTP for forgot password",
        body: t.Object({
            email: t.String({  format: "email" })
        })
    })

    // verify otp forgot password
    .post("/verify-otp", ({ body }) => {
        return ForgotPasswordController.verifyOtp(body);
    }, {
        tags: ["Forgot Password"],
        summary: "Verify OTP for forgot password",
        body: t.Object({
            email: t.String({  format: "email" }),
            code: t.String({ minLength: 6, maxLength: 6 })
        })
    })

    // reset password
    .post("/reset-password", ({ body }) => {
        return ForgotPasswordController.resetPassword(body);
    }, {
        tags: ["Forgot Password"],
        summary: "Reset password",
        body: t.Object({
            email: t.String({  format: "email" }),
            code: t.String({ minLength: 6, maxLength: 6 }),
            newPassword: t.String({ minLength: 8, maxLength: 255 }),
            confirmNewPassword: t.String({ minLength: 8 })
        })
    })