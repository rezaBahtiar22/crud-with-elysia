import type { AuthUserRegisterRequest, AuthUserRegisterResponse } from "../interfaces/authUserRegister"

import type { AuthUserLoginRequest, AuthUserLoginResponse } from "../interfaces/authUserLogin"
import { toAuthUserLoginResponse } from "../interfaces/authUserLogin"

import { toAuthUserLogoutResponse } from "../interfaces/AuthUserLogout"

import type { AuthUserUpdateRequest, AuthUserUpdateResponse } from "../interfaces/authUserUpdateProfile"
import {  toAuthUserUpdateResponse } from "../interfaces/authUserUpdateProfile"

import type { AuthUserUpdatePasswordRequest, AuthUserUpdatePasswordResponse } from "../interfaces/authUserUpdatePassword"

import type { AuthMeResponse } from "../interfaces/authMeData"
import { toAuthGetUserLoginResponse } from "../interfaces/authMeData"

import { generateToken } from "../utils/jwt"
import { prisma } from "../database/prisma"
import { ResponseError } from "../utils/responseError"
import * as argon2 from "argon2"
import { UserValidation } from "../utils/userAuthValidation"
import { Validation } from "../utils/validation"
import { logger } from "../utils/logging"
import crypto from "crypto"
import { issueAuthTokens } from "../utils/authToken"


export class AuthService {
    // service untuk register user
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

        // buat token
        const { accessToken, refreshToken } = 
            await issueAuthTokens(user);

        // kembalikan response user register
        return {
            message: "User registered successfully",
            accessToken,
            refreshToken,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    }

    // service untuk login user
    static async login(
        request: AuthUserLoginRequest
    ): Promise<AuthUserLoginResponse> {
        // validasi request body
        const loginUser = Validation.validate<AuthUserLoginRequest>(UserValidation.login, request);

        // cari user bedasarkan email
        const user = await prisma.user.findFirst({
            where: {
                email: loginUser.email,
                deletedAt: null
            }
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

        // generate token
        const { accessToken, refreshToken } = 
            await issueAuthTokens(user);

        // kembalikan response user login
        return toAuthUserLoginResponse(user, accessToken, refreshToken);
    }

    // service untuk update user profile(username dan email)
    static async updateProfile(
        user:{ id: number, role: string }, 
        request: AuthUserUpdateRequest
    ): Promise<AuthUserUpdateResponse> {
        // validasi request body
        const updateUser = Validation.validate<AuthUserUpdateRequest>(UserValidation.updateProfile, request);

        // cek jika user ada atau tidak
        if (!user) {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Authentication is required"
            );
        }

        // update user
        const dataUpdate: {
            name?: string
            email?: string
        } = {};

        // cek jika ada data name yang di update
        if (updateUser.name) {
            dataUpdate.name = updateUser.name;
        }

        // cek jika ada data email yang di update
        if (updateUser.email) {
            const existing = await prisma.user.findUnique({
                where: { email: updateUser.email }
            });

            // jika email sudah digunakan oleh user lain, lempar error
            if (existing && existing.id !== user.id) {
                throw new ResponseError(
                    409,
                    "Email_Already_Exists",
                    "Email is already registered"
                );
            }
            dataUpdate.email = updateUser.email;
        }

        // guard untuk mencegah user mengirim field kosong
        if (Object.keys(dataUpdate).length === 0) {
            throw new ResponseError(
                400,
                "Bad_Request",
                "Please provide at least one field to update"
            );
        }

        const result = await prisma.user.update({
            where: {
                id: user.id,
            },
            data: dataUpdate
        });

        // kembalikan response user update
        return toAuthUserUpdateResponse(result);
    }

    // service untuk update user password
    static async updatePassword(
        user:{ id: number, role: string }, 
        request: AuthUserUpdatePasswordRequest
    ): Promise<AuthUserUpdatePasswordResponse> {
        // validasi request body
        const updatePassword = Validation.validate<AuthUserUpdatePasswordRequest>(UserValidation.updatePassword, request);

        // cek auth jika user sudah login
        if (!user) {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Authentication is required"
            );
        }

        // ambil user dari DB
        const existingUser = await prisma.user.findUnique({
            where: {
                id: user.id
            },
            select: {
                id: true,
                password: true
            }
        });

        // cek jika user tidak ditemukan
        if (!existingUser) {
            throw new ResponseError(
                404,
                "Not_Found",
                "User not found"
            );
        }

        // cek password lama
        const isPasswordValid = await argon2.verify(
            existingUser.password,
            updatePassword.currentPassword
        );
        
        // jika password lama tidak valid
        if (!isPasswordValid) {
            throw new ResponseError(
                400,
                "Bad_Request",
                "Current password is incorrect"
            );
        }

        // block password yang baru dengan yang lama
        if (updatePassword.newPassword === updatePassword.currentPassword) {
            throw new ResponseError(
                400,
                "Bad_Request",
                "New password cannot be the same as the current password"
            );
        }

        // hash password baru
        const hashPassword = await argon2.hash(updatePassword.newPassword, {
            type: argon2.argon2id,
            hashLength: 64
        });

        // update password
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashPassword
            }
        });
        
        // kemablikan response user update password
        return {
            message: "Password updated successfully"
        }
    }

    // service untuk logout user
    static async logout(
        refreshToken: string
    ) {
        // cek jika refresh token ada
        if (!refreshToken) {
            logger.warn("Logout failed: Refresh token not provided");
            throw new ResponseError(
                401,
                "Refresh_Token_Required",
                "Authentication is required"
            );
        }

        // hash refresh token yang diterima
        const hashedToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // cari token di database
        const existingToken = await prisma.refreshToken.findUnique({
            where: {  tokens: hashedToken }
        });

        if (!existingToken) {
            logger.warn("Logout failed: Invalid refresh token");
            throw new ResponseError(
                401,
                "Invalid_Refresh_Token",
                "Refresh token is invalid"
            );
        }

        await prisma.refreshToken.delete({
            where: { tokens: hashedToken }
        });

        return toAuthUserLogoutResponse();
    }

    // service untuk auth me
    static async profile(
        user: { id: number }
    ): Promise<AuthMeResponse> {
        // ambil user dari DB
        const dbUser = await prisma.user.findUnique({
            where: {
                id: user.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true
            }
        });

        // cek jika user tidak ada
        if (!dbUser) {
            throw new ResponseError(
                404,
                "Not_Found",
                "User not found"
            );
        }

        // return response
        return toAuthGetUserLoginResponse(dbUser);
    }
}