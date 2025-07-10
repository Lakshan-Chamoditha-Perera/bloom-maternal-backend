import { DoctorDto } from "./doctor.dto";

export interface ClinicDto {
    id?: string; // Changed from number to string
    name?: string;
    location?: string;
    phone?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    // doctors?: ClinicDoctor[];
    // clinicVisits?: ClinicVisit[];
}

export interface ClinicDoctor {
    doctorId: string; // Changed from number to string
    clinicId: string; // Changed from number to string
    doctor?: DoctorDto;
    clinic?: ClinicDto;
    assignedAt?: Date;
}