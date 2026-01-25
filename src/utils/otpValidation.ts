import { z } from "zod";

// Request kirim OTP (login / register)
export const RequestOtpSchema = z.object({
  email: z.string().email()
});

// Request verifikasi OTP (login)
export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP harus 6 digit")
});

export type RequestOtpRequest = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpSchema>;
