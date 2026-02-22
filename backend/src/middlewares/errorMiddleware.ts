import { Elysia } from "elysia";
import { ZodError } from "zod";
import { ResponseError } from "../utils/responseError";

export const ErrorMiddleware = new Elysia({ name: "error-handler" })
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

            return {
                error: error.error,
                message: error.message,
                ...(Bun.env.NODE_ENV !== "production" && {
                    stackTrace: error.stack
                })
            }
        }

        // unknown error
        set.status = 500
        return {
            error: "Internal_Server_Error",
            message: "Something went wrong",
            ...(Bun.env.NODE_ENV !== "production" && {
                stackTrace: (error as Error).stack
            }),
        }
    })
    .as("global");