import { ResponseError } from "../utils/responseError";
import type { Role } from "../../generated/prisma/client"

export const RoleMiddleware = (allowedRoles: Role[]) =>
    ({ user }: {user: { role: Role }}) => {
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