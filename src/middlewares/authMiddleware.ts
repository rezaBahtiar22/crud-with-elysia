import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { ResponseError } from "../utils/responseError";
import { logger } from "../utils/logging";
import { error } from "winston";

export const AuthMiddleware = (app: Elysia) => app
    .decorate("user", null as null | {
        userId: number;
        role: string;
        iat: number;
        exp: number;
    })
    .decorate("token", null as null | string)
    .onBeforeHandle((ctx) => {
        // ambil toke dari header
        const authHeader = ctx.request.headers.get("authorization");

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

        try {
            // verify token
            const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
                userId: number;
                role: string;
                iat: number;
                exp: number;
            };
            
            // set ke context
            ctx.user = payload;
            ctx.token = token;

        } catch (error) {
            logger.warn("Invalid or Expired token", { error })
            throw new ResponseError(
                401,
                "Unauthorized",
                "Invalid or Expired token"
            )
        }
    });