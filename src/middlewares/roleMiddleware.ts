import { Elysia } from "elysia";
import { ResponseError } from "../utils/responseError";
import type { Role } from "../../generated/prisma/client"

export const RoleMiddleware = (allowedRoles: Role[]) =>
    new Elysia().onBeforeHandle(({ user }) => {

        // pastika user ada dan sudah di autentikasi
        if (!user) {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Authentication is required"
            );
        }

        // pastikan role sesuai
        if (!allowedRoles.includes(user.role)) {
            throw new ResponseError(
                403,
                "Forbidden",
                "Insufficient permissions"
            );
        }
    });