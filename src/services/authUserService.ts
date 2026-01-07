import type { AuthUserRegisterRequest, AuthUserRegisterResponse } from "../interfaces/authUserInterfaces"
import { toAuthUserRegisterResponse } from "../interfaces/authUserInterfaces"
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

}