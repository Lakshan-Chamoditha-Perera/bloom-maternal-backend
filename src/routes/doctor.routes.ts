import express from 'express';
import { doctorDashboard } from '../controllers/doctor.controller';

const DoctorRouter = express.Router();

DoctorRouter.get("/dashboard", doctorDashboard)



export default DoctorRouter;


