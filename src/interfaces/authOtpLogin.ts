export interface AuthOtpLoginRequest {
    email: string;
};

export interface AuthOtpVerifyLoginRequest {
    email: string;
    code: string;
};

export interface AuthOtpLoginResponse {
    message: string;
}

export interface AuthOtpVerifyLoginResponse {
    message: string;
    token: string;
}
