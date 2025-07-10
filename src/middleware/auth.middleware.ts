
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import { UserPayload } from "../types/auth.types";

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    console.log("Auth Middleware")

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            code: 401,
            message: "Authorization token missing or malformed",
        });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token) as UserPayload;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            code: 401,
            message: "Invalid or expired token",
        });
        return;
    }
};


// Alternative: Role-based middleware
// src/middleware/rbac.middleware.ts

export const requireRole = (roles: string[]) => {

    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user as UserPayload;

        if (!user) {
            res.status(401).json({
                code: 401,
                message: "Authentication required"
            });
            return;
        }

        if (!user.role || !roles.includes(user.role)) {
            res.status(403).json({
                code: 403,
                message: "Insufficient permissions"
            });
            return;
        }

        next();
    };
};

// Usage: router.get("/admin", authenticateToken, requireRole(["admin"]), adminController);