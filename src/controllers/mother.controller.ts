import { Request, Response } from "express";
import { StandardResponse } from "../types/payloads/StandardRespons";
import { MotherService } from "../services/mother.service";


const motherService = new MotherService();


// get all mothers
export const getAllMothers = async (req: Request, res: Response) => {
    try {
        const motherslist: any = await motherService.getAllMothersList();
        const response: StandardResponse<any> = {
            code: 200,
            message: "Mothers list fetched successfully",
            data: motherslist
        };
        res.status(201).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Mothers list fetch failed"
        };
        res.status(400).json(errorResponse);
    }
}

// find by id
export const getMotherProfileById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const motherProfile: any = await motherService.getMotherByUserId(id);
        const response: StandardResponse<any> = {
            code: 200,
            message: "Mother profile fetched successfully",
            data: motherProfile
        };
        res.status(200).json(response);
    } catch (err: any) {
        const errorResponse: StandardResponse<null> = {
            code: 400,
            message: err.message || "Mother profile fetch failed"
        };
        res.status(400).json(errorResponse);
    }
}
