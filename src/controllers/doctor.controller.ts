import { Request, Response } from "express";
import { DoctorService } from "../services/doctor.service";
import { StandardResponse } from "../types/payloads/StandardRespons";


// Doctor dashboard
const doctorService = new DoctorService();

export const doctorDashboard = async (req: Request, res: Response) => {
    try {
        const data = await doctorService.getDashboardProps();
        const response: StandardResponse<any> = {
            code: 200,
            message: "Dashoard data fetched successfully",
            data: data
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: "Dashboard data fetch failed"
        };
        res.status(400).json(errorResponse);
    }

}