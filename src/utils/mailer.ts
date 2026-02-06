import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type OtpPurpose = "LOGIN" | "REGISTER" | "RESET_PASSWORD";

export async function sendOTPEmail(
    email: string,
    code: string,
    purpose: OtpPurpose
) {
    let subject: string;
    let title: string;

    switch (purpose) {
        case "REGISTER":
            subject = "Register OTP";
            title = "Register Verification";
            break;

        case "LOGIN":
            subject = "Login OTP";
            title = "Login Verification";
            break;

        case "RESET_PASSWORD":
            subject = "Reset Password OTP";
            title = "Reset Password Verification";
            break;

        default:
            subject = "OTP Verification";
            title = "OTP Verification";
    }

    await resend.emails.send({
        from: process.env.MAIL_FROM!,
        to: email,
        subject,
        html: `
            <h2>${title}</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing:4px">${code}</h1>
            <p>This code will expire in 3 minutes.</p>
        `
    });
}
