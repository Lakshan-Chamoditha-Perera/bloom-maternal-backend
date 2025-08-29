import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { getAllMothers, getMotherProfileById } from '../controllers/mother.controller';

const MotherRouter = express.Router();
MotherRouter.get("/get-all", getAllMothers);
MotherRouter.get("/get-profile/:id", getMotherProfileById);

export default MotherRouter;