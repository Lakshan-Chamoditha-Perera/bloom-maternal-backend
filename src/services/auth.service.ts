import bcrypt from "bcrypt"; //npm i bcrypt
import { findUserByEmail, createUser } from "../repository/auth.repository";
import { generateToken } from "../utils/jwt.util";
import { createMotherProfile } from "../repository/mother.repository";
import { createDoctorProfile } from "../repository/doctor.repository";
import { CreateUserRequest } from "../types/payloads/requests/createUserRequest";
import { createClinicProfile } from "../repository/clinic.repository";

export const registerUser = async (dto: CreateUserRequest) => {
    const existing = await findUserByEmail(dto.email);
    if (existing) throw new Error("Email already in use");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await createUser({
        email: dto.email, password: hashedPassword,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
    });

    if (user.role === "MOTHER") {
        await createMotherProfile({
            userId: user.id,
            dob: new Date(dto.dob ?? new Date()),
            nicNumber: dto.nicNumber,
            phone: dto.phone ?? null,
            address: dto.address ?? null
        });
    }

    if (user.role === "DOCTOR") {
        await createDoctorProfile(
            {
                userId: user.id,
                licenseNumber: dto.licenseNumber ?? "",
            },
        );
    }


    if (user.role === "ORGANIZATION") {
        await createClinicProfile(
            {
                userId: user.id,
                name: "",
                location: dto?.address ?? "",
                phone: dto.phone,
                address: dto.address,
                isActive: true,
                clinic_code: dto.clinic_code ?? "",
            }
        )
    }

    return { user };
};

export const loginUser = async (email: string, password: string) => {
    const user = await findUserByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = generateToken({
        email: user.email,
        role: user.role,
        firstName: user.firstName!,
        lastName: user.lastName!,
    });
    return { token };
};
