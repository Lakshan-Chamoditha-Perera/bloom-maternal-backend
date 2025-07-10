import prisma from "../prisma/prismaClient";

// Create clinic profile
export const createClinicProfile = async (clinic: {
    userId: string;
    name: string;
    location: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    clinic_code: string;
}) => {
    return prisma.clinic.create({
        data: {
            userId: clinic.userId,
            name: clinic.name,
            location: clinic.location,
            phone: clinic.phone ?? null,
            address: clinic.address ?? null,
            isActive: clinic.isActive,
            clinic_code: clinic.clinic_code
        }
    });
};