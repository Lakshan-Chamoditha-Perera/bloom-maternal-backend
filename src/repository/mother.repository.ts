
import prisma from "../prisma/prismaClient";
import { MotherDto } from "../types/dtos/mother.dto";

// create mother profile
export const createMotherProfile = async (mother: MotherDto) => {
    return prisma.mother.create({
        data: {
            userId: mother.userId!,
            dob: mother.dob!,
            nicNumber: mother.nicNumber!,
            phone: mother.phone ?? null,
            address: mother.address ?? null,
        }
    });
};

// get mother profile by id
export const getMotherProfileById = async (id: string) => {
    return prisma.mother.findUnique({ where: { id } });
};

// get mother profile by userId
export const getMotherProfileByUserId = async (userId: string) => {
    return prisma.mother.findUnique({ where: { userId } });
};

//get all mothers
export const getAllMothers = async () => {
    return prisma.mother.findMany();
};

// find mother by id
export const findMotherById = async (id: string) => {
    return prisma.mother.findUnique({ where: { id } });
};

export const findMotherByNic = async (nic: string) => {
    return prisma.mother.findUnique({ where: { nicNumber: nic } });
};

//get all mothers count
export const getAllMothersCount = async () => {
    return prisma.mother.count();
};

//get highest risk mothers
export const getHighestRiskMedicleRecordsWithMother = async () => {
    return prisma.medicalRecord.findMany({
        where: {
            risk: "high"
        },
        include: {
            mother: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            }
        },
        orderBy: {
            recordedAt: "desc" // newest first
        }
    });
};


// get avg bp
export const getAvgBp = async () => {
    return prisma.medicalRecord.aggregate({
        _avg: {
            bloodPressure: true
        }
    });
};


export const getAvgSuger = async () => {
    return prisma.medicalRecord.aggregate({
        _avg: {
            sugarLevel: true
        }
    });
};
