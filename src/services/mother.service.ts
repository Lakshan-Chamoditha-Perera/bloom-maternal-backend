// services/mother.service.ts
import { getAllMothers, getAllMothersCount, getAvgBp, getAvgSuger, getHighestRiskMedicleRecordsWithMother, getMotherProfileByUserId } from "../repository/mother.repository";

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

    async getAllMothersListCount() {
        console.log("[MotherService:getAllMothersListCount] Incoming");
        try {
            const data = (await getAllMothersCount()) || [];
            return data;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    async getHighestRiskMedicleRecordsWithMother() {
        console.log("[MotherService:getHighestRiskMedicleRecordsWithMother] Incoming");
        try {
            const data = (await getHighestRiskMedicleRecordsWithMother()) || [];
            return data;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    // get avg bp
    async getAvgBpService() {
        console.log("[MotherService:getAvgBp] Incoming");
        try {
            const data = (await getAvgBp()) || [];
            return data;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    // get avg sugar
    async getAvgSugerService() {
        console.log("[MotherService:getAvgSuger] Incoming");
        try {
            const data = (await getAvgSuger()) || [];
            return data;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }


}
