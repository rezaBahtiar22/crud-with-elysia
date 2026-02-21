import type {  User, Role } from "../../generated/prisma/client";

// interface untuk admin get user by id
export interface AdminGetUserByIdResponse {
    id: number;
    name: string;
    email: string;
    role: Role;
    created_at: string;
    updated_at: string;
}

// fungsi mapper untuk response admin get user by id
export function toAdminGetUserByIdResponse(user: User): AdminGetUserByIdResponse {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
    };
}