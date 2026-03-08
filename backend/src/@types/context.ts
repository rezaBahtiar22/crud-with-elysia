export type AuthContext = {
    request: Request;
    user?: {
        id: number;
        role: string;
    };
    accessToken?: string;
} & any;