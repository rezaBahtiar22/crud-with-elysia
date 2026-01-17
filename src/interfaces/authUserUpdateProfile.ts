import type { User, Role } from "../../generated/prisma/client";

// interface untuk user update request
export interface AuthUserUpdateRequest {
    name?: string;
    email?: string;
};

// interface untuk user update response data
export interface AuthUserUpdateResponseData {
    id: number;
    name: string;
    email: string;
    role: Role;
};

// interface untuk user update response DTO
export interface AuthUserUpdateResponse {
    message: string;
    data: AuthUserUpdateResponseData;
    updatedAt: Date;
};

type SafeUser = Pick<User, "id" | "name" | "email" | "role">;

// fungsi mapper untuk response user update
export function toAuthUserUpdateResponse(user: SafeUser): AuthUserUpdateResponse {
    return {
        message: "User updated successfully",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        updatedAt: new Date()
    }
};