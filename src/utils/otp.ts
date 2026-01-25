import nodemailer from "nodemailer";
import { logger } from "./logging";

// create transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Kirim email OTP login / register
export async function sendOtpEmail(
    to: string,
    code: string,
    purpose: "LOGIN" | "REGISTER" | "RESET_PASSWORD"
) {
    let subject = "";
    let title = "";

    switch (purpose) {
        case "LOGIN":
            subject = "Your Login OTP Code";
            title = "Login Verification";
            break;
        case "REGISTER":
            subject = "Verify Your Email";
            title = "Email Verification";
            break;
        case "RESET_PASSWORD":
            subject = "Reset Password Code";
            title = "Reset Password";
            break;
    }

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${title}</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing: 4px;">${code}</h1>
            <p>This code will expire in 5 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
        });

        logger.info("OTP email sent", { to, purpose });
    } catch (error) {
        logger.error("Failed to send OTP email", { error });
        throw new Error("Failed to send OTP email");
    }
}
