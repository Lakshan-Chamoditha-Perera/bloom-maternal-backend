
import { getAllMothersCount, getAvgBp, getAvgSuger, getHighestRiskMedicleRecordsWithMother } from "../repository/mother.repository";
import { MotherService } from "./mother.service";

export class DoctorService {

    async getDashboardProps() {
        console.log("[DoctorService:getDashboardProps] Incoming");
        try {
            // total mothers count
            const totalMothersCount = await getAllMothersCount();
            console.log("[DoctorService:getDashboardProps] totalMothersCount:", totalMothersCount);

            // high risk mothers
            const highestRiskRecords = await getHighestRiskMedicleRecordsWithMother();

            // avg bp
            const avgBp = await getAvgBp();

            // avg sugar
            const avgSugar = await getAvgSuger();

            // medical records with mother desc by date
            const medicalRecordsWithMother = await getHighestRiskMedicleRecordsWithMother();

            return {
                totalMothersCount,
                highestRiskRecords,
                avgBp,
                avgSugar,
                medicalRecordsWithMother
            };
        } catch (err: any) {
            throw new Error(err.message);
        }
    }
}
