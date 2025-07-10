import express from 'express';
import authRoutes from './auth.routes';
import clinicRoutes from './clinic.routes';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);


export default router; 