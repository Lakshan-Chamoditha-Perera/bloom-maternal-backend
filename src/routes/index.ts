import express from 'express';
import authRoutes from './auth.routes';
import clinicRoutes from './clinic.routes';
import motherRouter from './mother.routes';
import medicleRecordsRouter from './medicleRecord.routes';

import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);
router.use("/mothers", motherRouter)
router.use("/medicle-records", medicleRecordsRouter)


export default router; 