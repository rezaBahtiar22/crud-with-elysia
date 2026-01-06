import { Elysia } from "elysia";
import { ZodError } from "zod";
import { ResponseError } from "../utils/responseError";

export const ErrorMiddleware = new Elysia()
    .onError(({ error, set }) => {
        // zod error validation
        if (error instanceof ZodError) {
            set.status = 422
            return {
                error: "Validation_Error",
                message: "Invalid request data",
                errors: error.issues,
            }
        }

        // custom error
        if (error instanceof ResponseError) {
            set.status = error.status

            const response: any = {
                error: error.error,
                message: error.message,
            }

            // stackTrace hanya ditampilkan di development
            const isProduction = (Bun.env.NODE_ENV ?? "development") === "production"
            if (isProduction) {
                response.stackTrace = error.stack
            }

            return response
        }

        // unknown error
        set.status = 500
        return {
            error: "Internal_Server_Error",
            message: "Something went wrong",
            ...(process.env.NODE_ENV !== "production" &&
                ("stack" in error ? { stackTrace: (error as Error).stack } : {})
            ),
        }
    })