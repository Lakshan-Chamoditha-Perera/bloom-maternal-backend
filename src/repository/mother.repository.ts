
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

