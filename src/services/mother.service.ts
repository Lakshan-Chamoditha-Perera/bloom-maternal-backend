// services/mother.service.ts
import { getAllMothers, getMotherProfileByUserId } from "../repository/mother.repository";

export class MotherService {
    /**
     * Get all mothers
     */
    async getAllMothersList() {
        console.log("[MotherService:getAllMothersList] Incoming");
        try {
            const data = (await getAllMothers()) || [];
            return data;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
     * Get mother profile by user ID
     * @param userId
     */
    async getMotherByUserId(userId: string) {
        console.log("[MotherService:getMotherByUserId] Incoming");
        try {
            const data = await getMotherProfileByUserId(userId);
            return data;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }
}
