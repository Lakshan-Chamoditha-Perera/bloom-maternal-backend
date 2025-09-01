import { Router } from "express";
import {
    createMedicalRecordController,
    getMedicalRecordsByMotherIdController,
    updateMedicalRecordController,
    deleteMedicalRecordController,
    getAllMedicleRecordsWithMotherController
} from "../controllers/medicleRecord.controller";

const MedicleRecordsRouter = Router();

// Create a new medical record
MedicleRecordsRouter.post("/", createMedicalRecordController);

// Get medical records by mother ID
MedicleRecordsRouter.get("/mother/:motherId", getMedicalRecordsByMotherIdController);

// Update medical record by ID
MedicleRecordsRouter.put("/:id", updateMedicalRecordController);

// Delete medical record by ID
MedicleRecordsRouter.delete("/:id", deleteMedicalRecordController);

// Get All medicle records with mother
MedicleRecordsRouter.get("/all", getAllMedicleRecordsWithMotherController);

export default MedicleRecordsRouter;