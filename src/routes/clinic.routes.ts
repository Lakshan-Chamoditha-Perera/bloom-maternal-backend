import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const ClinicRouter = express.Router();


export default ClinicRouter;