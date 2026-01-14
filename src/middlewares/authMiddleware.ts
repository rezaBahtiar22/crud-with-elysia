import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { ResponseError } from "../utils/responseError";

export const AuthMiddleware = new Elysia()
    .decorate("user", null as null | {
        userId: string;
        role: string;
        iat: number;
        exp: number;
    })
    .decorate("token", null as null | string)
    .onBeforeHandle((ctx) => {
        // ambil toke dari header
        const authHeader = ctx.headers.authorization;

        // cek jika token tidak ada
        if (!authHeader?.startsWith("Bearer ")) {
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
                userId: string;
                role: string;
                iat: number;
                exp: number;
            };
            
            // set ke context
            ctx.user = payload;
            ctx.token = token;
        } catch {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Invalid or Expired token"
            )
        }
    });