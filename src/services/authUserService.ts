import type { AuthUserRegisterRequest, AuthUserRegisterResponse } from "../interfaces/authUserRegister"
import { toAuthUserRegisterResponse } from "../interfaces/authUserRegister"

import type { AuthUserLoginRequest, AuthUserLoginResponse } from "../interfaces/authUserLogin"
import { toAuthUserLoginResponse } from "../interfaces/authUserLogin"

import { generateToken } from "../utils/jwt"
import { prisma } from "../database/prisma"
import { ResponseError } from "../utils/responseError"
import * as argon2 from "argon2"
import { UserValidation } from "../utils/userAuthValidation"
import { Validation } from "../utils/validation"


export class AuthService {

    static async register(
        request: AuthUserRegisterRequest
    ): Promise<AuthUserRegisterResponse> {
        // validate request body
        const regUser = Validation.validate<AuthUserRegisterRequest>(UserValidation.register, request);
        
        // cek apakah email sudah terdaftar
        const exist = await prisma.user.findUnique({
            where: { email: regUser.email }
        });
        
        // jika email sudah terdaftar, lempar error
        if (exist) {
            throw new ResponseError(
                409,
                "Email_Already_Exists",
                "Email is already registered"
            );
        }

        // hash password
        const hashPassword = await argon2.hash(regUser.password, {
            type: argon2.argon2id,
            hashLength: 64
        });
        
        // buat user baru
        const user = await prisma.user.create({
            data: {
                name: regUser.name,
                email: regUser.email,
                password: hashPassword
            }
        });

        // kembalikan response user register
        return toAuthUserRegisterResponse(user);
    }

    static async login(
        request: AuthUserLoginRequest
    ): Promise<AuthUserLoginResponse> {
        // validasi request body
        const loginUser = Validation.validate<AuthUserLoginRequest>(UserValidation.login, request);

        // cari user bedasarkan email
        const user = await prisma.user.findUnique({
            where: {email: loginUser.email}
        });

        // cek jika user tidak ditemukan
        if (!user) {
            throw new ResponseError(
                401,
                "Invalid_Credentials",
                "Email or password is incorrect"
            );
        }

        // verifikasi password
        const isPasswordValid = await argon2.verify(
            user.password,
            loginUser.password
        );

        // cek jika password tidak valid
        if (!isPasswordValid) {
            throw new ResponseError(
                401,
                "Invalid_Credentials",
                "Email or password is incorrect"
            );
        }

        // generate tokeen
        const token = generateToken({
            userId: user.id,
            role: user.role
        });

        // kembalikan response user login
        return toAuthUserLoginResponse(user, token);
    }

}