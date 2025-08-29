
import prisma from "../prisma/prismaClient";

// Create medicle record for mother
export const createMedicleRecord = async (medicleRecord: any) => {
    return prisma.medicalRecord.create({
        data: {
            bloodPressure: medicleRecord.bloodPressure,
            weight: medicleRecord.weight,
            sugarLevel: medicleRecord.sugarLevel,
            gestationalAge: medicleRecord.gestationalAge,
            notes: medicleRecord.notes,
            motherId: medicleRecord.motherId
        }
    })
}


// select * from MedicalRecord where motherId = ?
export const getMedicleRecordListByMotherId = async (motherId: string) => {
    return prisma.medicalRecord.findMany({
        where: {
            motherId
        }
    })
}

// delete by id
export const deleteMedicleRecordById = async (id: string) => {
    return prisma.medicalRecord.delete({
        where: {
            id
        }
    })
}

// update by id
export const updateMedicleRecordById = async (id: string, medicleRecord: any) => {
    return prisma.medicalRecord.update({
        where: {
            id
        },
        data: {
            bloodPressure: medicleRecord.bloodPressure ?? 0,
            weight: medicleRecord.weight,
            sugarLevel: medicleRecord.sugarLevel,
            gestationalAge: medicleRecord.gestationalAge,
        }
    })
}

