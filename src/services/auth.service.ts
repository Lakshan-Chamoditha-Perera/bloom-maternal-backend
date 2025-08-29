import bcrypt from "bcrypt"; // npm i bcrypt
import { findUserByEmail, createUser } from "../repository/auth.repository";
import { generateToken } from "../utils/jwt.util";
import { createMotherProfile } from "../repository/mother.repository";
import { CreateUserRequest } from "../types/payloads/requests/createUserRequest";

export const registerUser = async (dto: CreateUserRequest) => {
    console.log("[registerUser] Incoming DTO:", dto);

    try {
        // Check for existing user
        console.log("[registerUser] Checking if email exists:", dto.email);
        const existing = await findUserByEmail(dto.email);
        console.log("[registerUser] Existing user check result:", existing);

        if (existing) {
            console.error("[registerUser] Email already in use:", dto.email);
            throw new Error("Email already in use");
        }

        // Hash password
        // console.log("[registerUser] Hashing password...");
        // const hashedPassword = await bcrypt.hash(dto.password, 10);
        // console.log("[registerUser] Password hashed successfully");

        // Create user
        console.log("[registerUser] Creating user...");
        const user = await createUser({
            email: dto.email,
            password: dto.password,
            role: dto.role,
            firstName: dto.firstName,
            lastName: dto.lastName,
        });
        console.log("[registerUser] User created:", user);

        // Mother Registration
        if (user.role === "MOTHER") {
            console.log("[registerUser] Mother role detected — creating profile...");


            await createMotherProfile({
                userId: user.id,
                dob: new Date(),
                nicNumber: dto.nicNumber,
                phone: dto.phone ?? null,
                address: dto.address ?? null,
            });

            console.log("[registerUser] Mother profile created for userId:", user.id);
        }

        console.log("[registerUser] Registration completed successfully");
        return { user };
    } catch (error) {
        console.error("[registerUser] Error occurred:", error);
        throw error;
    }
};

export const loginUser = async (email: string, password: string) => {
    console.log("[loginUser] Attempting login for email:", email);

    try {
        // Find user by email
        console.log("[loginUser] Searching for user...");
        const user = await findUserByEmail(email);
        console.log("[loginUser] User search result:", user);

        if (!user) {
            console.error("[loginUser] No user found with email:", email);
            throw new Error("Invalid email or password");
        }

        // Compare password
        console.log("[loginUser] Comparing passwords...");
        const isMatch = await password == user.password;
        console.log("[loginUser] Password match result:", isMatch);

        if (!isMatch) {
            console.error("[loginUser] Password mismatch for email:", email);
            throw new Error("Invalid email or password");
        }

        // Generate JWT token
        console.log("[loginUser] Generating token...");
        const token = generateToken({
            email: user.email,
            role: user.role,
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
        });

        console.log("[loginUser] Token generated successfully");
        return { token, userRole: user.role };
    } catch (error) {
        console.error("[loginUser] Error occurred:", error);
        throw error;
    }
};
