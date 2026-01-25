import { prisma } from "../database/prisma"
import { generateOTP, generateOtpExpired } from "../utils/otp"
import { Validation } from "../utils/validation"
import { RequestOtpSchema, VerifyOtpSchema } from "../utils/otpValidation"
import { ResponseError } from "../utils/responseError"
import { generateToken } from "../utils/jwt"
// import { sendOtpEmail } from "../utils/mailer"

export class AuthOtpService {

    // kirim OTP ke email (login / register)
    static async requestOTP(req: unknown) {
        // validasi data request
        const data = Validation.validate(RequestOtpSchema, req);

        // cek apakah user ada
        const user = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        })

        if (!user) {
            throw new ResponseError(
                404,
                "Not_Found",
                "Email not found"
            );
        }

        // generate OTP
        const code = generateOTP();
        const expiresAt = generateOtpExpired(3);

        // simpan ke DB
        await prisma.emailOTP.create({
            data: {
                userId: user.id,
                email: data.email,
                code,
                purpose: "LOGIN",
                expiresAt
            }
        });

        // kirim email
        // await sendOtpEmail({
        //     to: data.email,
        //     subject: "Your Login OTP Code",
        //     text: `Your OTP code is: ${code} berlaku sampai ${expiresAt}`
        // });

        // return sementara
        return {
            message: "OTP sent successfully",
            otp: code
        };
    }

    // verifikasi OTP (login)
    static async verifyOTP(req: unknown) {
        // validasi data request
        const data = Validation.validate(VerifyOtpSchema, req);

        // cari OTP terbaru yang belum digunakan & belum expired
        const otpRecord = await prisma.emailOTP.findFirst({
            where: {
                email: data.email,
                code: data.code,
                purpose: "LOGIN",
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });

        if (!otpRecord) {
            throw new ResponseError(
                400,
                "Invalid_OTP",
                "OTP doeOTP is invalid or has expired"
            );
        }

        // ambil user
        const user = await prisma.user.findUnique({
            where: {
                id: otpRecord.userId
            }
        });

        // cek user
        if (!user) {
            throw new ResponseError(
                404,
                "Not_Found",
                "User not found"
            );
        }

        // tandai OTP yang sudah terpakai
        await prisma.emailOTP.update({
            where: {
                id: otpRecord.id
            },
            data: {
                used: true
            }
        });

        // buat token lagi
        const token = generateToken({ 
            userId: user.id, role: user.role 
        });

        // simpan token ke user
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                tokens: token
            }
        });

        return {
            message: "OTP verified successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    }

}