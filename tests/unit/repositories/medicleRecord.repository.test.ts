import {
  createMedicleRecord,
  getMedicleRecordListByMotherId,
  deleteMedicleRecordById,
  updateMedicleRecordById,
  getAllMedicleRecordsWithMother,
} from '../../../src/repository/medicleRecord.repository';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMedicalRecords } from '../../mocks/data/medicalRecords.mock';
import { mockMothers } from '../../mocks/data/mothers.mock';
import { mockPrismaClient } from '../../mocks/prisma.mock';

describe('MedicleRecordRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('createMedicleRecord', () => {
    it('should create medical record successfully', async () => {
      // Arrange
      const recordData = {
        bloodPressure: 120,
        weight: 65,
        height: 165,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Regular checkup',
        motherId: 'mother-123',
      };
      const expectedRecord = { ...mockMedicalRecords.normalRecord, ...recordData };
      mockPrismaClient.medicalRecord.create.mockResolvedValue(expectedRecord);

      // Act
      const result = await createMedicleRecord(recordData);

      // Assert
      expect(mockPrismaClient.medicalRecord.create).toHaveBeenCalledWith({
        data: {
          bloodPressure: recordData.bloodPressure,
          weight: recordData.weight,
          height: recordData.height,
          sugarLevel: recordData.sugarLevel,
          gestationalAge: recordData.gestationalAge,
          notes: recordData.notes,
          motherId: recordData.motherId,
        }
      });
      expect(result).toEqual(expectedRecord);
    });

    it('should create record with null values', async () => {
      // Arrange
      const recordData = {
        bloodPressure: null,
        weight: null,
        height: 165,
        sugarLevel: null,
        gestationalAge: null,
        notes: null,
        motherId: 'mother-456',
      };
      const expectedRecord = { ...mockMedicalRecords.incompleteRecord, ...recordData };
      mockPrismaClient.medicalRecord.create.mockResolvedValue(expectedRecord);

      // Act
      const result = await createMedicleRecord(recordData);

      // Assert
      expect(mockPrismaClient.medicalRecord.create).toHaveBeenCalledWith({
        data: {
          bloodPressure: null,
          weight: null,
          height: 165,
          sugarLevel: null,
          gestationalAge: null,
          notes: null,
          motherId: 'mother-456',
        }
      });
      expect(result).toEqual(expectedRecord);
    });

    it('should handle prisma creation errors', async () => {
      // Arrange
      const recordData = {
        bloodPressure: 120,
        weight: 65,
        height: 165,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Test',
        motherId: 'invalid-mother-id',
      };
      const error = new Error('Foreign key constraint failed');
      mockPrismaClient.medicalRecord.create.mockRejectedValue(error);

      // Act & Assert
      await expect(createMedicleRecord(recordData)).rejects.toThrow('Foreign key constraint failed');
    });

    it('should create record with complex data types', async () => {
      // Arrange
      const recordData = {
        bloodPressure: 140.5,
        weight: 72.3,
        height: 168.2,
        sugarLevel: 95.7,
        gestationalAge: 24,
        notes: 'Long detailed notes with special characters: áéíóú, 中文, émojis 🤰',
        motherId: 'mother-789',
      };
      const expectedRecord = { ...mockMedicalRecords.normalRecord, ...recordData };
      mockPrismaClient.medicalRecord.create.mockResolvedValue(expectedRecord);

      // Act
      const result = await createMedicleRecord(recordData);

      // Assert
      expect(result).toEqual(expectedRecord);
    });
  });

  describe('getMedicleRecordListByMotherId', () => {
    it('should retrieve medical records by mother ID', async () => {
      // Arrange
      const motherId = 'mother-123';
      const expectedRecords = [mockMedicalRecords.normalRecord, mockMedicalRecords.incompleteRecord];
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(expectedRecords);

      // Act
      const result = await getMedicleRecordListByMotherId(motherId);

      // Assert
      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalledWith({
        where: { motherId }
      });
      expect(result).toEqual(expectedRecords);
    });

    it('should return empty array when no records found', async () => {
      // Arrange
      const motherId = 'mother-no-records';
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue([]);

      // Act
      const result = await getMedicleRecordListByMotherId(motherId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle different mother IDs', async () => {
      // Arrange
      const motherIds = ['mother-123', 'mother-456', 'mother-789'];
      const expectedResults = [
        [mockMedicalRecords.normalRecord],
        [mockMedicalRecords.highRiskRecord],
        [mockMedicalRecords.recentRecord],
      ];

      for (let i = 0; i < motherIds.length; i++) {
        mockPrismaClient.medicalRecord.findMany.mockResolvedValueOnce(expectedResults[i]);
        
        // Act
        const result = await getMedicleRecordListByMotherId(motherIds[i]);
        
        // Assert
        expect(result).toEqual(expectedResults[i]);
      }
    });

    it('should handle large numbers of records', async () => {
      // Arrange
      const motherId = 'mother-many-records';
      const manyRecords = Array.from({ length: 100 }, (_, i) => ({
        ...mockMedicalRecords.normalRecord,
        id: `record-${i}`,
      }));
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(manyRecords);

      // Act
      const result = await getMedicleRecordListByMotherId(motherId);

      // Assert
      expect(result).toHaveLength(100);
      expect(result).toEqual(manyRecords);
    });
  });

  describe('deleteMedicleRecordById', () => {
    it('should delete medical record by ID', async () => {
      // Arrange
      const recordId = 'record-123';
      const deletedRecord = mockMedicalRecords.normalRecord;
      mockPrismaClient.medicalRecord.delete.mockResolvedValue(deletedRecord);

      // Act
      const result = await deleteMedicleRecordById(recordId);

      // Assert
      expect(mockPrismaClient.medicalRecord.delete).toHaveBeenCalledWith({
        where: { id: recordId }
      });
      expect(result).toEqual(deletedRecord);
    });

    it('should handle deletion of non-existent record', async () => {
      // Arrange
      const recordId = 'non-existent-record';
      const error = new Error('Record not found');
      mockPrismaClient.medicalRecord.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteMedicleRecordById(recordId)).rejects.toThrow('Record not found');
      expect(mockPrismaClient.medicalRecord.delete).toHaveBeenCalledWith({
        where: { id: recordId }
      });
    });

    it('should handle database constraint errors during deletion', async () => {
      // Arrange
      const recordId = 'record-with-references';
      const error = new Error('Cannot delete record with existing references');
      mockPrismaClient.medicalRecord.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteMedicleRecordById(recordId)).rejects.toThrow('Cannot delete record with existing references');
    });
  });

  describe('updateMedicleRecordById', () => {
    it('should update medical record successfully', async () => {
      // Arrange
      const recordId = 'record-123';
      const updateData = {
        bloodPressure: 130,
        weight: 70,
        height: 170,
        sugarLevel: 95,
        gestationalAge: 25,
      };
      const updatedRecord = { ...mockMedicalRecords.normalRecord, ...updateData };
      mockPrismaClient.medicalRecord.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await updateMedicleRecordById(recordId, updateData);

      // Assert
      expect(mockPrismaClient.medicalRecord.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: {
          bloodPressure: updateData.bloodPressure,
          weight: updateData.weight,
          height: updateData.height,
          sugarLevel: updateData.sugarLevel,
          gestationalAge: updateData.gestationalAge,
        }
      });
      expect(result).toEqual(updatedRecord);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const recordId = 'record-456';
      const updateData = {
        weight: 68,
        sugarLevel: 92,
      };
      const updatedRecord = { ...mockMedicalRecords.normalRecord, ...updateData };
      mockPrismaClient.medicalRecord.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await updateMedicleRecordById(recordId, updateData);

      // Assert
      expect(mockPrismaClient.medicalRecord.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: {
          bloodPressure: 0, // Default value when not provided
          weight: updateData.weight,
          height: undefined,
          sugarLevel: updateData.sugarLevel,
          gestationalAge: undefined,
        }
      });
      expect(result).toEqual(updatedRecord);
    });

    it('should handle update with undefined bloodPressure', async () => {
      // Arrange
      const recordId = 'record-789';
      const updateData = {
        bloodPressure: undefined,
        weight: 65,
        height: 165,
      };
      const updatedRecord = { ...mockMedicalRecords.normalRecord, bloodPressure: 0 };
      mockPrismaClient.medicalRecord.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await updateMedicleRecordById(recordId, updateData);

      // Assert
      expect(mockPrismaClient.medicalRecord.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: {
          bloodPressure: 0, // Default value when undefined
          weight: updateData.weight,
          height: updateData.height,
          sugarLevel: undefined,
          gestationalAge: undefined,
        }
      });
    });

    it('should handle update of non-existent record', async () => {
      // Arrange
      const recordId = 'non-existent-record';
      const updateData = { weight: 70 };
      const error = new Error('Record not found');
      mockPrismaClient.medicalRecord.update.mockRejectedValue(error);

      // Act & Assert
      await expect(updateMedicleRecordById(recordId, updateData)).rejects.toThrow('Record not found');
    });
  });

  describe('getAllMedicleRecordsWithMother', () => {
    it('should retrieve all medical records with mother data', async () => {
      // Arrange
      const expectedRecords = [
        {
          ...mockMedicalRecords.normalRecord,
          mother: mockMothers.validMother1,
        },
        {
          ...mockMedicalRecords.highRiskRecord,
          mother: mockMothers.validMother2,
        },
        {
          ...mockMedicalRecords.recentRecord,
          mother: mockMothers.pregnantMother,
        },
      ];
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(expectedRecords);

      // Act
      const result = await getAllMedicleRecordsWithMother();

      // Assert
      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalledWith({
        include: { mother: true }
      });
      expect(result).toEqual(expectedRecords);
    });

    it('should return empty array when no records exist', async () => {
      // Arrange
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue([]);

      // Act
      const result = await getAllMedicleRecordsWithMother();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle records without mother data gracefully', async () => {
      // Arrange
      const recordsWithoutMother = [
        {
          ...mockMedicalRecords.normalRecord,
          mother: null,
        },
      ];
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(recordsWithoutMother);

      // Act
      const result = await getAllMedicleRecordsWithMother();

      // Assert
      expect(result).toEqual(recordsWithoutMother);
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockMedicalRecords.normalRecord,
        id: `record-${i}`,
        mother: {
          ...mockMothers.validMother1,
          id: `mother-${i % 10}`, // 10 different mothers
        },
      }));
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(largeDataset);

      // Act
      const result = await getAllMedicleRecordsWithMother();

      // Assert
      expect(result).toHaveLength(500);
      expect(result).toEqual(largeDataset);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection timeout');
      mockPrismaClient.medicalRecord.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(getAllMedicleRecordsWithMother()).rejects.toThrow('Database connection timeout');
    });
  });
});