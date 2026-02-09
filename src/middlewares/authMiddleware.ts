import jwt from "jsonwebtoken";
import { ResponseError } from "../utils/responseError";
import { logger } from "../utils/logging";
import type { AuthContext } from "../@types/context";

export function AuthMiddleware(ctx: AuthContext) {
  // ambil token dari header
  const authHeader = ctx.request.headers.get("authorization");

  // cek jika token tidak ada
  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("Token not found");
    throw new ResponseError(
      401,
      "TOKEN_NOT_FOUND",
      "Token not found"
    );
  }

  // parsing token
  const token = authHeader.split(" ")[1];

  // cek jika token tidak valid
  if (!token) {
    throw new ResponseError(
      401,
      "INVALID_TOKEN",
      "Invalid token"
    );
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: number;
      role: string;
    };

    ctx.user = payload;
    ctx.token = token;
  } catch {
    throw new ResponseError(
      401,
      "INVALID_TOKEN",
      "Invalid or expired token"
    );
  }
}