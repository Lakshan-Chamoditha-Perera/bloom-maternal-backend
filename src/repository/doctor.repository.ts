import { Doctor } from "@prisma/client";
import prisma from "../prisma/prismaClient";
import { DoctorDto } from "../types/dtos/doctor.dto";


export const createDoctorProfile = async (doctor: DoctorDto) => {
    return await prisma.doctor.create({
        data: {
            userId: doctor.userId!,
            licenseNumber: doctor?.licenseNumber ?? ""
        },
    });
};
