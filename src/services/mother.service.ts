import { getAllMothers, getMotherProfileByUserId } from "../repository/mother.repository";


// get all mothers
export const getAllMothersList = async () => {
    console.log("[getAllMothers] Incoming");
    try {
        const data = await getAllMothers() || [];
        return data;
    } catch (err: any) {
        throw new Error(err.message);
    }
}

// get mother profile by userId
export const getMotherByUserId = async (id: string) => {
    console.log("[getMotherProfileByUserId] Incoming");
    try {
        const data = await getMotherProfileByUserId(id);
        return data
    } catch (err: any) {
        throw new Error(err.message);
    }
}