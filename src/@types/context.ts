export type AuthContext = {
    user: {
        id: string;
        role: string;
    };
    token: string;
} & any;