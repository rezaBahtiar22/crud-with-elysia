import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ? process.env.JWT_SECRET : "NanaErzaaJFNC128736SHAU@#$%!hd&%d";
const EXPIRED_IN = "1d";

// interface untuk payload JWT
export interface JwtPayload {
    id: number
    role: string
};

// fungsi untuk generate token
export function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: EXPIRED_IN
    });
}


// fungsi untuk verify token
export function verifyToken(token:string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}