// Generate OTP numerik 6 digit
export function generateOTP(length: number = 6): string {
    let otp = "";
    for (let n = 0; n < length; n++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
}

// Generate expired time (default 3 minutes)
export function generateOtpExpired(minutes: number = 3): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + minutes);
    return expires;
}