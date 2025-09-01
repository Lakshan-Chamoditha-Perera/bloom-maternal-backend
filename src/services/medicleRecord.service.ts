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
    async createMedicalRecordAndPredict(dto: any) {
        console.log("[MedicleRecordService:createMedicalRecordAndPredict] Incoming DTO:", dto);

        try {
            // 1) Validate mother
            const mother = await findMotherById(dto.motherId);
            if (!mother) {
                console.error("[MedicleRecordService:createMedicalRecordAndPredict] Mother not found:", dto.motherId);
                throw new Error("Mother not found");
            }

            // 2) Compute age (if mother.dob exists), else fallback
            const computeAge = (dob?: Date | string | null) => {
                if (!dob) return 25;
                const d = new Date(dob);
                const now = new Date();
                let age = now.getFullYear() - d.getFullYear();
                const m = now.getMonth() - d.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
                return age;
            };
            const age = (dto as any).age ?? computeAge((mother as any)?.dob);

            // 3) Build predictor payload (use bpStr if provided; otherwise a safe default)
            const bpStr: string =
                (dto as any).bpStr && typeof (dto as any).bpStr === "string"
                    ? (dto as any).bpStr
                    : "110/70";

            const payload = {
                age: 25,
                height_cm: dto.height ?? 160,
                weight_kg: dto.weight ?? 60,
                bp_str: bpStr,
                sugar_mg_dL: dto.sugarLevel ?? 90,
            };

            console.log("[MedicleRecordService:createMedicalRecordAndPredict] Predictor payload:", payload);

            // 4) Call predictor
            const pr = await this.predictor.predict(payload);
            console.log("[MedicleRecordService:createMedicalRecordAndPredict] Predictor response code:", pr.code, "msg:", pr.message);

            // 5) Normalize predicted label → DB risk ("LOW" | "MEDIUM" | "HIGH" | "UNKNOWN")
            const normalize = (lbl?: string) => {
                if (!lbl) return "UNKNOWN";
                const up = String(lbl).toUpperCase();
                return ["LOW", "MEDIUM", "HIGH"].includes(up) ? up : "UNKNOWN";
            };
            const risk = normalize(pr?.data?.predicted_label);

            // 6) Persist record with predicted risk
            const created = await createMedicleRecord({
                bloodPressure: dto.bloodPressure ?? null,
                weight: dto.weight ?? null,
                height: dto.height ?? null,
                sugarLevel: dto.sugarLevel ?? null,
                gestationalAge: dto.gestationalAge ?? null,
                notes: dto.notes ?? null,
                motherId: dto.motherId,
                risk, // <-- persist predicted risk at creation time
            });

            console.log(
                "[MedicleRecordService:createMedicalRecordAndPredict] Created record with risk:",
                created.id,
                created.risk
            );

            // 7) Return persisted record + prediction details for UI (optional)
            return {
                record: created,
                prediction: {
                    riskLabel: risk,
                    predictedProba: pr?.data?.predicted_proba,
                    featureVector: pr?.data?.feature_vector,
                    flags: pr?.data?.flags ?? [],
                    overrideApplied: !!pr?.data?.override_applied,
                },
            };
        } catch (err: any) {
            console.error("[MedicleRecordService:createMedicalRecordAndPredict] Error:", err?.message || err);
            throw new Error(err?.message || "Failed to create medical record with prediction");
        }
    }

}
