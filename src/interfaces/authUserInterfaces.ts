import type { User, Role } from "../../generated/prisma/client"

// interface untuk user register request DTO
export interface AuthUserRegisterRequest  {
    name: string
    email: string
    password: string
};

// interface untuk user register response data
export interface AuthUserResponseData {
        id: number
        name: string
        email: string
        role: Role
};

// interface untuk user register response DTO
export interface AuthUserRegisterResponse {
    message: string
    data: AuthUserResponseData
}

// fungsi mapper untuk response user register
export function toAuthUserRegisterResponse(
    user: User
): AuthUserRegisterResponse {
    return {
        message: "User registered successfully",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}