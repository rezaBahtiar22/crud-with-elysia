import type {  User } from "../../generated/prisma/client";

// interface untuk admin get user by id
export interface GetUserByIdResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

// fungsi mapper untuk response admin get user by id
export function toAuthGetUserByIdResponse(user: User): GetUserByIdResponse {
    return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at.toString(),
        updated_at: user.updated_at.toString(),
    };
}