import { prisma } from "../database/prisma"
import { generateOTP, generateOtpExpired } from "../utils/otp"
import { Validation } from "../utils/validation"
import { AuthOtpValidation } from "../utils/otpValidation"
import { ResponseError } from "../utils/responseError"
import { generateToken } from "../utils/jwt"
import { sendOTPEmail } from "../utils/mailer"
import { otpRateLimit } from "../middlewares/otpRateLimiter"

export class AuthOtpService {

    // request otp
    static async requestOtp(email: string) {
        // validasi email
        const data = Validation.validate(AuthOtpValidation.requestOtp, { email });

        // rate limiter
        const key = `Otp_${data.email}`;
        await otpRateLimit(key);

        // cek user ada atau tidak
        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        // cek jika user tidak ditemukan
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

        // hapus otp lama sebelum insert baru
        await prisma.emailOTP.updateMany({
            where: {
                email: user.email,
                purpose: "LOGIN",
                used: false
            },
            data: {
                used: true
            }
        })

        // simpan Otp ke DB
        await prisma.emailOTP.create({
            data: {
                userId: user.id,
                email: user.email,
                code,
                purpose: "LOGIN",
                expiresAt
            }
        });

        // kirim email
        await sendOTPEmail(user.email, code);

        return {
            message: "OTP has been sent to your email"
        };
    }

    // verifikasi otp & login
    static async verifyOtp(email: string, code: string) {
        // validasi email & code
        const data = Validation.validate(AuthOtpValidation.verifyOtp, { email, code });

        // cari otp valid yang belum digunakan
        const otp = await prisma.emailOTP.findFirst({
            where: {
                email: data.email,
                code: data.code,
                purpose: "LOGIN",
                used: false,
                expiresAt: {
                    gt: new Date(),
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });

        // cek jika otp tidak ditemukan
        if (!otp) {
            throw new ResponseError(
                400,
                "Bad_Request",
                "Invalid OTP"
            );
        }

        // tandai otp sudah digunakan
        await prisma.emailOTP.update({
            where: { id: otp.id },
            data: { used: true }
        });

        // ambil user
        const user = await prisma.user.findUnique({
            where: { id: otp.userId }
        });

        // cek jika user tidak ditemukan
        if (!user) {
            throw new ResponseError(
                404,
                "Not_Found",
                "User not found"
            );
        }

        // buat token jwt
        const token = generateToken({ userId: user.id, role: user.role });

        // simpan token ke user
        await prisma.user.update({
            where: { id: user.id },
            data: { tokens: token }
        });

        return {
            message: "Login Success",
            token
        };
    }

}