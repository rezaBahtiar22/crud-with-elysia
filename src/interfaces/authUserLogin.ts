import type { User, Role } from "../../generated/prisma/client"

// interface untuk user login request
export interface AuthUserLoginRequest {
    email: string
    password: string
};

// interface untuk login user data
export interface AuthUserLoginData {
    id: number
    name: string
    email: string
    role: Role
};

// tokens
export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

// interface untuk user login response
export interface AuthUserLoginResponse {
    message: string
    user: AuthUserLoginData
    tokens: AuthTokens
};

// fungsi mapper untuk response user login
export function toAuthUserLoginResponse(
    user: User, 
    accessToken: string,
    refreshToken: string
): AuthUserLoginResponse {
    return {
        message: "User logged in successfully",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        tokens: {
            accessToken,
            refreshToken
        }
    }
};