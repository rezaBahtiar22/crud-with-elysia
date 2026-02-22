// req verifikasi otp lupa password
export interface VerifyForgotOtpRequest {
    email: string;
    code: string;
};

// response verifikasi otp lupa password
export interface VerifyForgotOtpResponse {
    message: string;
};