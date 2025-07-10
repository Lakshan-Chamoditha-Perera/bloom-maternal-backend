import { Role } from "../../dtos/types";

/* DTOs for REST API */
export interface CreateUserRequest {
    email: string;
    password: string;
    role: Role;

    firstName?: string;
    lastName?: string;
    dob?: Date;
    nicNumber?: string;
    phone?: string;
    address?: string;

    licenseNumber?: string; // doctor license number

    clinic_code?: string//clinic code
}