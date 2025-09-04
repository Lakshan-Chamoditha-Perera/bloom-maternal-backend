import { Router } from "express";
import {
    getMedicalRecordsByMotherIdController,
    updateMedicalRecordController,
    deleteMedicalRecordController,
    getAllMedicleRecordsWithMotherController,
    createMedicalRecordAndPredictController
} from "../controllers/medicleRecord.controller";

const MedicleRecordsRouter = Router();

// Get medical records by mother ID
MedicleRecordsRouter.get("/mother/:motherId", getMedicalRecordsByMotherIdController);

// Update medical record by ID
MedicleRecordsRouter.put("/:id", updateMedicalRecordController);

// Delete medical record by ID
MedicleRecordsRouter.delete("/:id", deleteMedicalRecordController);

// Get All medicle records with mother
MedicleRecordsRouter.get("/all", getAllMedicleRecordsWithMotherController);

// Create a new medical record and predict risk
MedicleRecordsRouter.post("/predict", createMedicalRecordAndPredictController);

export default MedicleRecordsRouter;