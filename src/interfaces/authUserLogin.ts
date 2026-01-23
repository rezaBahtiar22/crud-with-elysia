import type { User, Role } from "../../generated/prisma/client"

// interface untuk user login request
export interface AuthUserLoginRequest {
    email: string
    password: string
};

// interface untuk user login response data
export interface AuthUserLoginResponseData {
    token?: string
    id: number
    name: string
    email: string
    role: Role
};

// interface untuk user login response
export interface AuthUserLoginResponse {
    message: string
    data: AuthUserLoginResponseData
};

// fungsi mapper untuk response user login
export function toAuthUserLoginResponse(
    user: User, token: string
): AuthUserLoginResponse {
    return {
        message: "User logged in successfully",
        data: {
            token,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    }
};