import 'elysia';
import type { Role } from '../../generated/prisma/client';

declare module 'elysia' {
    interface Singleton {
        user: null | {
            id: number;
            role: Role;
        };
        token: null | string;
    }
}

export {};