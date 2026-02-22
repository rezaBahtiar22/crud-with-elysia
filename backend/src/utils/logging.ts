import winston from "winston";

// membuat logger dengan level debug sederhana
export const logger = winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({})
    ],
})