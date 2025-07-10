import prisma from "../prisma/prismaClient";

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
};

export const createUser = async (data: {
    email: string;
    password: string;
    role: "MOTHER" | "DOCTOR";
    firstName?: string;
    lastName?: string;
}) => {
    return prisma.user.create({ data });
}; 
