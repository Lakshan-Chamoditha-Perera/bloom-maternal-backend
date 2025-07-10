export interface UserPayload {
    id: string;
    email: string;
    role?: string;
    iat?: number;
    exp?: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}
