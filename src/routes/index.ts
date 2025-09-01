import express from 'express';
import authRoutes from './auth.routes';
import doctorRouter from './doctor.routes';
import motherRouter from './mother.routes';
import medicleRecordsRouter from './medicleRecord.routes';

import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/doctors', doctorRouter);
router.use("/mothers", motherRouter)
router.use("/medicle-records", medicleRecordsRouter)


export default router; 