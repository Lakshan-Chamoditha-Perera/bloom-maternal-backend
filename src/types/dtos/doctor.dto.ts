import { UserDto } from "./user.dto";

export interface DoctorDto {
    id?: string; // Changed from number to string
    userId?: string; // Changed from number to string
    user?: UserDto;
    licenseNumber?: string;
    specialty?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    // clinics?: ClinicDoctor[];
    // clinicVisits?: ClinicVisit[];
}