// interface untuk user update password request
export interface AuthUserUpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};

// interface untuk user update password response
export interface AuthUserUpdatePasswordResponse {
    message: string;
};