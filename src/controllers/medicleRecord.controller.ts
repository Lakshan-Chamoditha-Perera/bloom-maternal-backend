import { Request, Response } from "express";
import {
    createMedicalRecord,
    getMedicalRecordsByMotherId,
    updateMedicalRecord,
    deleteMedicalRecord
} from "../services/medicleRecord.service";
import { StandardResponse } from "../types/payloads/StandardRespons";

export type MedicleRecord = {
    bloodPressure: number;
    weight: number;
    sugarLevel: number;
    gestationalAge: number;
    notes: string;
    motherId: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Create a new medical record
export const createMedicalRecordController = async (req: Request, res: Response) => {
    try {
        const medicleRecordData: MedicleRecord = req.body;
        const newRecord = await createMedicalRecord(medicleRecordData);
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
        const records = await getMedicalRecordsByMotherId(motherId);
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
        const updatedRecord = await updateMedicalRecord(id, updateData);
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
        await deleteMedicalRecord(id);
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