import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { ResponseError } from "../utils/responseError";

const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET : "NanaErzaaJFNC128736SHAU@#$%!hd&%d";

export const AuthMiddleware = new Elysia()
    .derive(({ headers }) => {
        // ambil toke dari header
        const authHeader = headers.authorization;

        // cek jika token tidak ada
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
            const payload = jwt.verify(token, JWT_SECRET);
            
            // kembalikan payload
            return { user: payload }
        } catch {
            throw new ResponseError(
                401,
                "Unauthorized",
                "Invalid or Expired token"
            )
        }
    });