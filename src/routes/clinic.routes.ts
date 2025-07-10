import express from 'express';
import { createClinic } from '../controllers/clinic.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const ClinicRouter = express.Router();

ClinicRouter.post(
    "/create",
    authenticateToken,
    // requireRole([Doctor]),
    createClinic
);

export default ClinicRouter;