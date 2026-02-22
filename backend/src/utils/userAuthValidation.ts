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
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(255, { message: "Password must be at most 255 characters long" })
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
            )
    });

    // schema untuk user login validasi
    static readonly login = z.object({
        email: z.string()
            .trim()
            .email("Invalid email address")
            .max(100),

        password: z.string()
            .min(8)
            .max(255)
    });

    // schema untuk user update profile
    static readonly updateProfile = z.object({
        name: z.string()
            .trim()
            .min(4, "Name must be at least 4 characters long")
            .max(100)
            .optional(),
        
        email: z.string()
            .trim()
            .email("Invalid email address")
            .max(100)
            .optional()
    }).refine(
        data => data.name || data.email,
        { 
            message: "At least one field must be updated",
        }
    );

    // schema untuk user update password
    static readonly updatePassword = z.object({
        currentPassword: z.string()
            .min(1, { message: "Password is currently required" }),

        newPassword: z.string()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(255, { message: "Password must be at most 255 characters long" })
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
            ),
        
        confirmNewPassword: z.string()
            .min(1, { message: "Password confirmation is required" }),
    }).refine(
        data => data.newPassword === data.confirmNewPassword,
        { 
            message: "New password and confirm new password must match",
            path: ["confirmNewPassword"]
        }
    );
}