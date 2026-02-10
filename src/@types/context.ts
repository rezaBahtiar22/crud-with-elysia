export type AuthContext = {
    request: Request;
    user?: {
        id: string;
        role: string;
    };
    accessToken?: string;
} & any;