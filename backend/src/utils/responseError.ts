// response error untuk custom error handling
export class ResponseError extends Error {
    public status: number
    public error: string

    constructor(
        status: number,
        error: string,
        message: string
    ) {
        super(message)

        this.status = status
        this.error = error

        Object.setPrototypeOf(this, ResponseError.prototype);
    }
};