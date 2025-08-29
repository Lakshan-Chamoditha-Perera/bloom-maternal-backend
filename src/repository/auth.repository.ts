import prisma from "../prisma/prismaClient";

export const findUserByEmail = async (email: string) => {
    console.log("findUserByEmail Repository | email: ", email)
    return prisma.user.findUnique({ where: { email } });
};

export const createUser = async (data: {
    email: string;
    password: string;
    role: "MOTHER" | "CLINIC_USER";
    firstName?: string;
    lastName?: string;
}) => {
    console.log("createUser Repository")
    return prisma.user.create({ data });
}; 
