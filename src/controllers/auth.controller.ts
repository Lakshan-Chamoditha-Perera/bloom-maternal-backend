// controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { StandardResponse } from "../types/payloads/StandardRespons";

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
    console.log("[AuthController:register] Incoming registration request");

    try {
        console.log("[AuthController:register] Request body:", req.body);
        const result = await authService.registerUser(req.body);

        console.log("[AuthController:register] Registration successful for email:", req.body.email);
        const response: StandardResponse<any> = {
            code: 201,
            message: "User registered successfully",
            data: result,
        };
        res.status(201).json(response);
    } catch (err: any) {
        console.error("[AuthController:register] Registration failed:", err.message);
        res.status(400).json({
            code: 400,
            message: err.message || "Registration failed",
        });
    }
};

export const login = async (req: Request, res: Response) => {
    console.log("[AuthController:login] Incoming login request");

    try {
        const { username, password } = req.body;
        console.log("[AuthController:login] Attempting login for email:", username);

        const result = await authService.loginUser({
            email: username,
            password,
        });

        console.log("[AuthController:login] Login successful for email:", username);
        const response: StandardResponse<any> = {
            code: 200,
            message: "Login successful",
            data: result,
        };
        res.status(200).json(response);
    } catch (err: any) {
        console.error("[AuthController:login] Login failed:", err.message);
        res.status(400).json({
            code: 400,
            message: err.message || "Login failed",
        });
    }
};
