import { Resend } from "resend"

// buat variabel resend 
const resend = new Resend(process.env.RESEND_API_KEY);

// kirim OTP ke email
export async function sendOTPEmail(email: string, code: string) {
    await resend.emails.send({
        from: process.env.MAIL_FROM!,
        to: email,
        subject: "Verifikasi OTP",
        html: `
            <h2>Login Verification</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing:4px">${code}</h1>
            <p>This code will expire in 3 minutes.</p>
        `
    });
}