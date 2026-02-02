import 'elysia';

declare module 'elysia' {
    interface Context {
        user: null | {
            id: number;
            role: string;
        };
        token: null | string;
    }
}