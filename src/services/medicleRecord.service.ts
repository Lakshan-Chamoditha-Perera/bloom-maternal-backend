import { MedicleRecord } from "../controllers/medicleRecord.controller";
import {
    createMedicleRecord,
    getMedicleRecordListByMotherId,
    deleteMedicleRecordById,
    updateMedicleRecordById
} from "../repository/medicleRecord.repository";

// create medical record for mother
export const createMedicalRecord = async (medicleRecordData: MedicleRecord) => {
    console.log("[createMedicalRecord] Incoming");
    try {
        const data = await createMedicleRecord(medicleRecordData);
        return data;
    } catch (err: any) {
        throw new Error(err.message);
    }
}

// get medical records by mother ID
export const getMedicalRecordsByMotherId = async (motherId: string) => {
    console.log("[getMedicalRecordsByMotherId] Incoming");
    try {
        const data = await getMedicleRecordListByMotherId(motherId) || [];
        return data;
    } catch (err: any) {
        throw new Error(err.message);
    }
}

// update medical record by ID
export const updateMedicalRecord = async (id: string, updateData: Partial<MedicleRecord>) => {
    console.log("[updateMedicalRecord] Incoming");
    try {
        const data = await updateMedicleRecordById(id, updateData);
        return data;
    } catch (err: any) {
        throw new Error(err.message);
    }
}

// delete medical record by ID
export const deleteMedicalRecord = async (id: string) => {
    console.log("[deleteMedicalRecord] Incoming");
    try {
        await deleteMedicleRecordById(id);
        return { message: "Medical record deleted successfully" };
    } catch (err: any) {
        throw new Error(err.message);
    }
}