// services/mother.service.ts
import { PredictorClient } from "../clients/predictor.client";
import { MedicleRecord } from "../controllers/medicleRecord.controller";
import {
    createMedicleRecord,
    getMedicleRecordListByMotherId,
    deleteMedicleRecordById,
    updateMedicleRecordById,
    getAllMedicleRecordsWithMother
} from "../repository/medicleRecord.repository";
import { findMotherById } from "../repository/mother.repository";

export class MedicleRecordService {

    // Dependencies
    private predictor = new PredictorClient();


    /**
     * Create medical record for a mother
     * @param medicleRecordData
     */
    async createMedicalRecord(medicleRecordData: MedicleRecord) {
        console.log("[MotherService:createMedicalRecord] Incoming");
        try {
            const motherExists = await findMotherById(medicleRecordData.motherId);
            if (!motherExists) {
                throw new Error("Mother not found");
            }
            return await createMedicleRecord(medicleRecordData);
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
     * Get medical records by mother ID
     * @param motherId
     */
    async getMedicalRecordsByMotherId(motherId: string) {
        console.log("[MotherService:getMedicalRecordsByMotherId] Incoming");
        try {
            return (await getMedicleRecordListByMotherId(motherId)) || [];
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
     * Update medical record by ID
     * @param id
     * @param updateData
     */
    async updateMedicalRecord(id: string, updateData: Partial<MedicleRecord>) {
        console.log("[MotherService:updateMedicalRecord] Incoming");
        try {
            return await updateMedicleRecordById(id, updateData);
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
     * Delete medical record by ID
     * @param id
     */
    async deleteMedicalRecord(id: string) {
        console.log("[MotherService:deleteMedicalRecord] Incoming");
        try {
            await deleteMedicleRecordById(id);
            return { message: "Medical record deleted successfully" };
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    // Get All medicle records with mothers
    async getAllMedicleRecordsWithMother() {
        console.log("[MotherService:getAllMedicleRecordsWithMother] Incoming");
        try {
            return await getAllMedicleRecordsWithMother();
        } catch (err: any) {
            throw new Error(err.message);
        }
    }


    // Create medical record and predict
    async createMedicalRecordAndPredict(dto: MedicleRecord) {

    }

}
