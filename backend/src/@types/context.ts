import type { Context } from "elysia";
import type { Role } from "../../generated/prisma";

export type AuthContext = Omit<Context, "user" | "query" | "params" | "body"> & {
    user?: {
        id: number;
        role: Role;
    };
    accessToken?: string;
    body: any;
    query: any;
    params: any;
};
