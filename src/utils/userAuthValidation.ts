import { z } from "zod";

export class UserValidation {
    // schema untuk user validasi register
    static readonly register = z.object({
        name: z.string()
            .trim()
            .min(4, "Name must be at least 4 characters long")
            .max(100),
        
        email: z.string()
            .trim()
            .email("Invalid email address")
            .max(100),
        
        password: z.string()
            .trim()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(255, { message: "Password must be at most 255 characters long" })
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                "Password harus mengandung huruf kecil, besar, angka, dan simbol"
            )
    });
}