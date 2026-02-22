import { ResponseError } from "../utils/responseError";
import type { Role } from "../../generated/prisma/client"
import type { AuthContext } from "../@types/context";

export const RoleMiddleware = (allowedRoles: Role[]) =>
    (ctx: AuthContext) => {

        const { user } = ctx;
        if (!user) {
            throw new ResponseError(
                401, 
                "Unauthorized", 
                "Authentication is required"
            );
        }
        if (!allowedRoles.includes(user.role)) {
            throw new ResponseError(
                403, 
                "Forbidden", 
                "Access denied"
            );
        }
    }