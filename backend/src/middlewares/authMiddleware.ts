import jwt, { type JwtPayload } from "jsonwebtoken";
import { ResponseError } from "../utils/responseError";
import { logger } from "../utils/logging";
import type { AuthContext } from "../@types/context";

export function AuthMiddleware(ctx: AuthContext) {
  // ambil token dari header
  const authHeader = ctx.request.headers.get("authorization");

  // cek jika token tidak ada
  if (!authHeader ||!authHeader?.startsWith("Bearer ")) {
    logger.warn("Token not found");
    throw new ResponseError(
      401,
      "TOKEN_NOT_FOUND",
      "Token not found"
    );
  }

  // parsing token
  const accessToken = authHeader.split(" ")[1];

  // cek jika token tidak valid
  if (!accessToken) {
    throw new ResponseError(
      401,
      "INVALID_TOKEN",
      "Invalid token"
    );
  }

  try {
    // verifikasi token
    const payload = jwt.verify(
      accessToken,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    // simpan data user ke context
    ctx.user = {
      id: payload.id,
      role: payload.role,
    };

    ctx.accessToken = accessToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("Token has expired");
      throw new ResponseError(
        401,
        "TOKEN_EXPIRED",
        "Token has expired"
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid token");
      throw new ResponseError(
        401,
        "INVALID_TOKEN",
        "Invalid token"
      );
    }

    throw new ResponseError(
      401,
      "AUTHENTICATION_FAILED",
      "Authentication failed"
    );
  }
}