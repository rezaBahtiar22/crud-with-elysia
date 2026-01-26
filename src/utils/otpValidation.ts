import { z } from "zod";

export class AuthOtpValidation {

  // request kirim OTP
  static readonly requestOtp = z.object({
    email: z.string().email("Invalid email address"),
  });

  // verify OTP
  static readonly verifyOtp = z.object({
    email: z.string().email("Invalid email address"),
    code: z.string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
  });
}
