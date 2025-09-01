// clients/predictor.client.ts
import axios from "axios";

export type PredictRequest = {
    age: number;
    height_cm: number;
    weight_kg: number;
    bp_str: string;
    sugar_mg_dL: number;
};

export type PredictResponse = {
    code: number;
    message: string;
    data: {
        feature_vector: {
            Age: number;
            BMI: number;
            Diastolic: number;
            Height_cm: number;
            RuleRiskScore: number;
            Sugar_mg_dL: number;
            Systolic: number;
            Weight_kg: number;
        };
        flags: string[];
        override_applied: boolean;
        predicted_label: "Low" | "Medium" | "High" | string;
        predicted_proba: Record<string, number>;
    };
};

const baseURL = process.env.PREDICT_API_BASE || "http://localhost:5000";
const timeout = Number(process.env.PREDICT_API_TIMEOUT_MS || 4000);

export class PredictorClient {
    async predict(input: PredictRequest): Promise<PredictResponse> {
        console.log("[PredictorClient:predict] Predicting...");
        const res = await axios.post<PredictResponse>(`${baseURL}/predict`, input, {
            timeout,
            headers: { "Content-Type": "application/json" },
            validateStatus: () => true,
        });
        if (!res.data || res.status >= 400 || res.data.code >= 400) {
            throw new Error(`Predict API error: HTTP ${res.status}, code ${res.data?.code}`);
        }
        return res.data;
    }
}
