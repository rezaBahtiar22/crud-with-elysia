import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { ResponseError } from "../utils/responseError";
import { logger } from "../utils/logging";

export const AuthMiddleware = (app: Elysia) => app
    .derive(({ request }) => {
        // ambil token dari header
        const authHeader = request.headers.get("authorization");

        // cek jika token tidak ada
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            logger.warn("Token not found");
            throw new ResponseError(
                401,
                "Unauthorized",
                "Token not found"
            );
        }

        // parsing token
        const token = authHeader.split(" ")[1];

        // cek jika token tidak valid
        if (!token) {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Invalid token"
            );
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: number;
            role: string;
        };

        return {
            user: payload,
            token
        };
    })
    .as("global");