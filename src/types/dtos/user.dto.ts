import { Role } from "./types";

export interface UserDto {
    id: string; // Changed from number to string
    email: string;
    password: string;
    role: Role;
    createdAt?: Date;
    updatedAt?: Date;
    // motherProfile?: MotherDto;
    // doctorProfile?: DoctorDto;
}