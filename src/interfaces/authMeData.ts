import type { Role } from "../../generated/prisma/client";

// interface untuk data user login
export interface AuthMeData {
    id: number;
    name: string;
    email: string;
    role: Role;
};

// interface untuk user login response
export interface AuthMeResponse {
    message: string;
    data: AuthMeData;
};

// fungsi mapper untuk response user login
export function toAuthGetUserLoginResponse(
    user: {  id: number; name: string; email: string; role: Role }
): AuthMeResponse {
    return {
        message: "User logged in successfully",
        data: user
    };
}