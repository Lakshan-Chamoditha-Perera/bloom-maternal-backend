
import { VisitStatus } from "./types";
import { UserDto } from "./user.dto";

export interface MotherDto {
    id?: string; // Changed from number to string
    userId?: string; // Changed from number to string
    user?: UserDto;
    dob?: Date;
    phone?: string | null;
    address?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    // medicalRecords?: MedicalRecord[];
    // clinicVisits?: ClinicVisit[];
    nicNumber?: string;
}


export interface ClinicVisit {
    id: string; // Changed from number to string
    motherId: string; // Changed from number to string
    mother?: MotherDto;
    clinicId: string; // Changed from number to string
    // clinic?: ClinicDto;
    doctorId?: string | null; // Changed from number to string
    // doctor?: DoctorDto | null;
    visitDate: Date;
    status: VisitStatus;
    purpose?: string | null;
    reminderSent: boolean;
    createdAt: Date;
    updatedAt: Date;
    medicalRecords?: MedicalRecord[];
}


export interface MedicalRecord {
    id: string; // Changed from number to string
    motherId: string; // Changed from number to string
    mother?: MotherDto;
    clinicVisitId?: string | null; // Changed from number to string
    // clinicVisit?: ClinicVisit | null;
    bloodPressure?: string | null;
    weight?: number | null;
    sugarLevel?: number | null;
    gestationalAge?: number | null;
    notes?: string | null;
    recordedAt: Date;
    updatedAt: Date;
}
