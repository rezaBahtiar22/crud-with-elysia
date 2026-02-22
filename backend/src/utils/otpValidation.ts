import { z } from "zod";

export class AuthOtpValidation {

  // request kirim OTP
  static readonly requestOtp = z.object({
    email: z.string().email("Invalid email address"),
  });

  // verify OTP register 
  static readonly verifyOtp = z.object({
    email: z.string().email("Invalid email address"),
    code: z.string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
    name: z.string()
      .min(4, "Name must be at least 4 characters long")
      .max(100),
  });

  // verify OTP login
  static readonly verifyLoginOtp = z.object({
    email: z.string().email("Invalid email address"),
    code: z.string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
  });
}
