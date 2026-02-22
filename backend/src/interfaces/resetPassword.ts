// request reset password
export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
    confirmNewPassword: string;
};

// response reset password
export interface ResetPasswordResponse {
    message: string;
};