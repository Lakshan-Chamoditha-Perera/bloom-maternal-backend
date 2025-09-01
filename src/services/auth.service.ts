// services/auth.service.ts
import bcrypt from "bcrypt";
import { findUserByEmail, createUser } from "../repository/auth.repository";
import { generateToken } from "../utils/jwt.util";
import { createMotherProfile } from "../repository/mother.repository";
import { CreateUserRequest } from "../types/payloads/requests/createUserRequest";

export class AuthService {
    /**
     * Register a new user (and optionally create a mother profile)
     */
    async registerUser(dto: CreateUserRequest) {
        console.log("[AuthService:registerUser] Incoming DTO:", dto);

        // Check for existing user
        console.log("[AuthService:registerUser] Checking if email exists:", dto.email);
        const existing = await findUserByEmail(dto.email);
        if (existing) {
            console.error("[AuthService:registerUser] Email already in use:", dto.email);
            throw new Error("Email already in use");
        }

        // Hash password
        console.log("[AuthService:registerUser] Hashing password...");
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        console.log("[AuthService:registerUser] Creating user...");
        const user = await createUser({
            email: dto.email,
            password: hashedPassword,
            role: dto.role,
            firstName: dto.firstName,
            lastName: dto.lastName,
        });
        console.log("[AuthService:registerUser] User created:", user);

        // Mother Registration
        if (user.role === "MOTHER") {
            console.log("[AuthService:registerUser] Mother role detected — creating profile...");
            await createMotherProfile({
                userId: user.id,
                dob: dto.dob ?? new Date(),
                nicNumber: dto.nicNumber,
                phone: dto.phone ?? null,
                address: dto.address ?? null,
            });
            console.log("[AuthService:registerUser] Mother profile created for userId:", user.id);
        }

        console.log("[AuthService:registerUser] Registration completed successfully");
        return { user };
    }

    /**
     * Login user and return JWT
     */
    async loginUser({
        email,
        password
    }: {
        email: string;
        password: string;
    }) {
        console.log("[AuthService:loginUser] Attempting login for email:", email);

        // Find user by email
        const user = await findUserByEmail(email);
        if (!user) {
            console.error("[AuthService:loginUser] No user found with email:", email);
            throw new Error("Invalid email or password");
        }

        // Compare password
        console.log("[AuthService:loginUser] Comparing passwords...");
        const isMatch = await password === user.password;
        if (!isMatch) {
            console.error("[AuthService:loginUser] Password mismatch for email:", email);
            throw new Error("Invalid email or password");
        }

        // Generate JWT token
        console.log("[AuthService:loginUser] Generating token...");
        const token = generateToken({
            email: user.email,
            role: user.role,
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
        });

        console.log("[AuthService:loginUser] Token generated successfully");
        return { token, userRole: user.role };
    }
}
