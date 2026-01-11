export interface AuthUserLogout {
    message: string
};

export function toAuthUserLogoutResponse(): AuthUserLogout {
    return {
        message: "User logged out successfully"
    }
};