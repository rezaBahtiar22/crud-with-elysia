import 'elysia';

declare module 'elysia' {
    interface Singleton {
        user: null | {
            id: number;
            role: string;
        };
        token: null | string;
    }
}

export {};