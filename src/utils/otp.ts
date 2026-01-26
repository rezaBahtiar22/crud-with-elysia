// Generate OTP numerik 6 digit
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate expired time (default 3 minutes)
export function generateOtpExpired(minutes: number = 3): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + minutes);
    return expires;
}