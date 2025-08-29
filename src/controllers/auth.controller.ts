import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";
import { StandardResponse } from "../types/payloads/StandardRespons";

// Register
export const register = async (req: Request, res: Response) => {
    try {
        const { user } = await registerUser(req.body);
        const response: StandardResponse<{ user: any }> = {
            code: 201,
            message: "User registered successfully",
            data: { user },
        };
        res.status(201).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Registration failed",
        };
        res.status(400).json(errorResponse);
    }
};

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const { token } = await loginUser(username, password);

        const response: StandardResponse<{ token: string }> = {
            code: 200,
            message: "Login successful",
            data: { token },
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Login failed",
        };
        res.status(400).json(errorResponse);
    }
};

// test method for test middleware is working or not
export const testAuth = (req: Request, res: Response) => {

    return res.status(200).json({
        code: 200,
        message: "Auth middleware works!",
    });
};