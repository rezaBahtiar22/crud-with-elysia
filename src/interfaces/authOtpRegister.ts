export interface AuthRegisterOtpRequest {
    email: string
}

export interface AuthVerifyRegisterOtpRequest {
    email: string
    code: string
    name: string
}

export interface AuthOtpRegisterResponse {
    message: string;
}

export interface AuthOtpVerifyRegisterResponse {
    message: string;
    token: string;
}
