import { prisma } from "../database/prisma"
import { generateOTP, generateOtpExpired } from "../utils/otp"
import { Validation } from "../utils/validation"
import { AuthOtpValidation } from "../utils/otpValidation"
import { ResponseError } from "../utils/responseError"
import { generateToken } from "../utils/jwt"
import { sendOTPEmail } from "../utils/mailer"
import { otpRateLimit } from "../middlewares/otpRateLimiter"

import type { 
    AuthOtpLoginRequest, 
    AuthOtpVerifyLoginRequest, 
    AuthOtpLoginResponse, 
    AuthOtpVerifyLoginResponse 
} from "../interfaces/authOtpLogin"

import type { 
    AuthRegisterOtpRequest, 
    AuthVerifyRegisterOtpRequest, 
    AuthOtpRegisterResponse, 
    AuthOtpVerifyRegisterResponse 
} from "../interfaces/authOtpRegister"



export class AuthOtpService {

    // request otp
    static async requestOtpLogin(
        request: AuthOtpLoginRequest
    ): Promise<AuthOtpLoginResponse> {
        // validasi email
        const data = Validation.validate(AuthOtpValidation.requestOtp, request);

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
                expiresAt,
                attempts: 0
            }
        });

        // kirim email
        await sendOTPEmail(user.email, code);

        return {
            message: "OTP has been sent to your email"
        };
    }

    // verifikasi otp & login
    static async verifyOtpLogin(
        request: AuthOtpVerifyLoginRequest
    ): Promise<AuthOtpVerifyLoginResponse> {
        // validasi email & code
        const data = Validation.validate(AuthOtpValidation.verifyOtp, request);

        // cari otp valid yang belum digunakan
        const otp = await prisma.emailOTP.findFirst({
            where: {
                email: data.email,
                purpose: "LOGIN",
                used: false,
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

        // cek block
        if (otp.blockedUntil && otp.blockedUntil > new Date()) {
            throw new ResponseError(
                429,
                "Too_Many_Requests",
                "Too many requests, please try again later in 3 minutes"
            );
        }

        // cek apakah salah / expired
        if (otp.code !== data.code || otp.expiresAt < new Date()) {
            const attempts = otp.attempts + 1;

            // kalau sudah 3x salah -> block 3 menit
            if (attempts >= 3) {
                await prisma.emailOTP.update({
                    where: { id: otp.id },
                    data: {
                        attempts,
                        blockedUntil: new Date(Date.now() + 3 * 60 * 1000)
                    }
                });

                throw new ResponseError(
                    429,
                    "Too_Many_Requests",
                    "Too many requests, please try again later in 3 minutes"
                )
            }

            // tandai otp sudah digunakan
            await prisma.emailOTP.update({
                where: { id: otp.id },
                data: { attempts }
            });

            throw new ResponseError(
                400,
                "Bad_Request",
                "Invalid OTP"
            )
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

        return {
            message: "Login Success",
            token
        };
    }

    static async requestOtpRegister(
        request: AuthRegisterOtpRequest
    ): Promise<AuthOtpRegisterResponse> {
        // validasi email
        const data = Validation.validate(AuthOtpValidation.requestOtp, request);

        // rate limiter
        const key = `Otp_${data.email}`;
        await otpRateLimit(key);

        // cek apakah email sudah dipakai atau belum
        const emailExists = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        // jika email sudah dipakai
        if (emailExists) {
            throw new ResponseError(
                400,
                "Bad_Request",
                "Email already exists"
            );
        }

        // generate OTP & expired
        const code = generateOTP();
        const expiresAt = generateOtpExpired();

        await prisma.emailOTP.create({
            data: {
                email: data.email,
                userId: 0,
                code,
                purpose: "REGISTER",
                expiresAt,
                attempts: 0
            }
        });

        // kirim email
        await sendOTPEmail(data.email, code);

        return {
            message: "OTP has been sent to your email"
        }
    }

    // register otp + create user
    static async verifyRegisterOtp(
        request: AuthVerifyRegisterOtpRequest
    ): Promise<AuthOtpVerifyRegisterResponse> {
        // validasi email & code
        const data = Validation.validate(AuthOtpValidation.verifyOtp, request);

        // cari otp valid
        const otp = await prisma.emailOTP.findFirst({
            where: {
                email: data.email,
                code: data.code,
                purpose: "REGISTER",
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });

        // jika otp tidak ditemukan
        if (!otp) {
            throw new ResponseError(
                400,
                "Bad_Request",
                "Invalid OTP"
            );
        }

        // buat user tanpa password
        const newUser = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: "",
                role: "USER"
            }
        });

        // tandai otp yang terpakai
        await prisma.emailOTP.update({
            where: { id: otp.id },
            data: { used: true }
        });

        // langsung login
        const token = generateToken({ userId: newUser.id, role: newUser.role });

        await prisma.user.update({
            where: { id: newUser.id },
            data: { tokens: token }
        });

        return {
            message: "Register Success",
            token
        }
    }

}