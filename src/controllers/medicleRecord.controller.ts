import { Request, Response } from "express";
import {
    MedicleRecordService
} from "../services/medicleRecord.service";
import { StandardResponse } from "../types/payloads/StandardRespons";

export type MedicleRecord = {
    bloodPressure: number;
    weight: number;
    height: number;
    sugarLevel: number;
    gestationalAge: number;
    notes: string;
    motherId: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    risk?: string;
}

const medicleRecordService = new MedicleRecordService();

// Create a new medical record
export const createMedicalRecordController = async (req: Request, res: Response) => {
    try {
        const medicleRecordData: MedicleRecord = req.body;
        const newRecord = await medicleRecordService.createMedicalRecord(medicleRecordData);
        const response: StandardResponse<MedicleRecord> = {
            code: 201,
            message: "Medical record created successfully",
            data: newRecord
        };
        res.status(201).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Medical record creation failed"
        };
        res.status(400).json(errorResponse);
    }
}

// Get medical records by mother ID
export const getMedicalRecordsByMotherIdController = async (req: Request, res: Response) => {
    try {
        const { motherId } = req.params;
        const records = await medicleRecordService.getMedicalRecordsByMotherId(motherId);
        const response: StandardResponse<MedicleRecord[]> = {
            code: 200,
            message: "Medical records fetched successfully",
            data: records
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Medical records fetch failed"
        };
        res.status(400).json(errorResponse);
    }
}

// Update medical record by ID
export const updateMedicalRecordController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: Partial<MedicleRecord> = req.body;
        const updatedRecord = await medicleRecordService.updateMedicalRecord(id, updateData);
        const response: StandardResponse<MedicleRecord> = {
            code: 200,
            message: "Medical record updated successfully",
            data: updatedRecord
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Medical record update failed"
        };
        res.status(400).json(errorResponse);
    }
}

// Delete medical record by ID
export const deleteMedicalRecordController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await medicleRecordService.deleteMedicalRecord(id);
        const response: StandardResponse<null> = {
            code: 200,
            message: "Medical record deleted successfully",
            data: null
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Medical record deletion failed"
        };
        res.status(400).json(errorResponse);
    }
}

// Get All medicle records with mother
export const getAllMedicleRecordsWithMotherController = async (req: Request, res: Response) => {
    try {
        const records = await medicleRecordService.getAllMedicleRecordsWithMother();
        const response: StandardResponse<any> = {
            code: 200,
            message: "Medicle records with mother fetched successfully",
            data: records
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: "Medicle records with mother fetch failed"
        };
        res.status(400).json(errorResponse);
    }
}


export const createMedicalRecordAndPredictController = async (req: Request, res: Response) => {
    console.log("[MedicalRecordController:createMedicalRecordAndPredict] Incoming request");

    const numOrNull = (v: any) => {
        if (v === undefined || v === null || v === "") return null;
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
    };

    try {
        const motherId = (req.params as any).motherId ?? (req.body?.motherId as string | undefined);
        if (!motherId) {
            const errorResp: StandardResponse<null> = {
                code: 400,
                message: "motherId is required (as path param or in body)",
                data: null,
            };
            res.status(400).json(errorResp);
            return;
        }

        const dto = {
            motherId,
            height: numOrNull(req.body?.height),
            weight: numOrNull(req.body?.weight),
            bloodPressure: numOrNull(req.body?.bloodPressure),
            sugarLevel: numOrNull(req.body?.sugarLevel),
            gestationalAge: numOrNull(req.body?.gestationalAge),
            notes: req.body?.notes ?? null,
            bpStr: req.body?.bpStr,                 // e.g., "110/70"
            age: numOrNull(req.body?.age) ?? undefined,
        };

        const result = await medicleRecordService.createMedicalRecordAndPredict(dto);

        const response: StandardResponse<any> = {
            code: 201,
            message: "Medical record created with prediction",
            data: result, // { record, prediction }
        };
        res.status(201).json(response);
    } catch (err: any) {
        console.error("[MedicalRecordController:createMedicalRecordAndPredict] Error:", err?.message || err);
        const errorResp: StandardResponse<null> = {
            code: 400,
            message: err?.message || "Failed to create medical record with prediction",
            data: null,
        };
        res.status(400).json(errorResp);
    }
};