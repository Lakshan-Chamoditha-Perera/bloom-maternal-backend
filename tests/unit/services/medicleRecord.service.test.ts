import { MedicleRecordService } from '../../../src/services/medicleRecord.service';
import { PredictorClient } from '../../../src/clients/predictor.client';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMedicalRecords } from '../../mocks/data/medicalRecords.mock';
import { mockMothers } from '../../mocks/data/mothers.mock';
import { mockPredictionResponses } from '../../mocks/services/predictor.mock';
import * as medicleRecordRepository from '../../../src/repository/medicleRecord.repository';
import * as motherRepository from '../../../src/repository/mother.repository';

// Mock the repositories and predictor client
jest.mock('../../../src/repository/medicleRecord.repository');
jest.mock('../../../src/repository/mother.repository');
jest.mock('../../../src/clients/predictor.client');

const mockMedicleRecordRepository = medicleRecordRepository as jest.Mocked<typeof medicleRecordRepository>;
const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;
const MockedPredictorClient = PredictorClient as jest.MockedClass<typeof PredictorClient>;

describe('MedicleRecordService', () => {
  let medicleRecordService: MedicleRecordService;
  let mockPredictorClient: jest.Mocked<PredictorClient>;

  beforeEach(() => {
    mockPredictorClient = new MockedPredictorClient() as jest.Mocked<PredictorClient>;
    medicleRecordService = new MedicleRecordService();
    
    // Replace the predictor instance in the service
    (medicleRecordService as any).predictor = mockPredictorClient;
    
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('getMedicalRecordsByMotherId', () => {
    it('should retrieve medical records by mother ID successfully', async () => {
      // Arrange
      const motherId = 'mother-123';
      const expectedRecords = [mockMedicalRecords.normalRecord, mockMedicalRecords.incompleteRecord];
      mockMedicleRecordRepository.getMedicleRecordListByMotherId.mockResolvedValue(expectedRecords);

      // Act
      const result = await medicleRecordService.getMedicalRecordsByMotherId(motherId);

      // Assert
      expect(mockMedicleRecordRepository.getMedicleRecordListByMotherId).toHaveBeenCalledWith(motherId);
      expect(result).toEqual(expectedRecords);
    });

    it('should return empty array when no records found', async () => {
      // Arrange
      const motherId = 'mother-with-no-records';
      mockMedicleRecordRepository.getMedicleRecordListByMotherId.mockResolvedValue(null as any);

      // Act
      const result = await medicleRecordService.getMedicalRecordsByMotherId(motherId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const motherId = 'invalid-mother-id';
      const error = new Error('Mother not found');
      mockMedicleRecordRepository.getMedicleRecordListByMotherId.mockRejectedValue(error);

      // Act & Assert
      await expect(medicleRecordService.getMedicalRecordsByMotherId(motherId)).rejects.toThrow('Mother not found');
    });
  });

  describe('updateMedicalRecord', () => {
    it('should update medical record successfully', async () => {
      // Arrange
      const recordId = 'record-123';
      const updateData = { weight: 70, bloodPressure: 125 };
      const updatedRecord = { ...mockMedicalRecords.normalRecord, ...updateData };
      mockMedicleRecordRepository.updateMedicleRecordById.mockResolvedValue(updatedRecord);

      // Act
      const result = await medicleRecordService.updateMedicalRecord(recordId, updateData);

      // Assert
      expect(mockMedicleRecordRepository.updateMedicleRecordById).toHaveBeenCalledWith(recordId, updateData);
      expect(result).toEqual(updatedRecord);
    });

    it('should handle non-existent record updates', async () => {
      // Arrange
      const recordId = 'non-existent-record';
      const updateData = { weight: 70 };
      const error = new Error('Medical record not found');
      mockMedicleRecordRepository.updateMedicleRecordById.mockRejectedValue(error);

      // Act & Assert
      await expect(medicleRecordService.updateMedicalRecord(recordId, updateData)).rejects.toThrow('Medical record not found');
    });
  });

  describe('deleteMedicalRecord', () => {
    it('should delete medical record successfully', async () => {
      // Arrange
      const recordId = 'record-123';
      const deletedRecord = mockMedicalRecords.normalRecord;
      mockMedicleRecordRepository.deleteMedicleRecordById.mockResolvedValue(deletedRecord);

      // Act
      const result = await medicleRecordService.deleteMedicalRecord(recordId);

      // Assert
      expect(mockMedicleRecordRepository.deleteMedicleRecordById).toHaveBeenCalledWith(recordId);
      expect(result).toEqual({ message: 'Medical record deleted successfully' });
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const recordId = 'non-existent-record';
      const error = new Error('Medical record not found');
      mockMedicleRecordRepository.deleteMedicleRecordById.mockRejectedValue(error);

      // Act & Assert
      await expect(medicleRecordService.deleteMedicalRecord(recordId)).rejects.toThrow('Medical record not found');
    });
  });

  describe('getAllMedicleRecordsWithMother', () => {
    it('should retrieve all medical records with mother data', async () => {
      // Arrange
      const expectedData = [
        { ...mockMedicalRecords.normalRecord, mother: mockMothers.validMother1 },
        { ...mockMedicalRecords.highRiskRecord, mother: mockMothers.validMother2 },
      ];
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue(expectedData);

      // Act
      const result = await medicleRecordService.getAllMedicleRecordsWithMother();

      // Assert
      expect(mockMedicleRecordRepository.getAllMedicleRecordsWithMother).toHaveBeenCalled();
      expect(result).toEqual(expectedData);
    });

    it('should handle empty results', async () => {
      // Arrange
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue([]);

      // Act
      const result = await medicleRecordService.getAllMedicleRecordsWithMother();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createMedicalRecordAndPredict', () => {
    it('should create medical record with prediction successfully', async () => {
      // Arrange
      const dto = {
        motherNic: '920123456V',
        height: 165,
        weight: 65,
        bloodPressure: 120,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Regular checkup',
        bpStr: '120/80',
        age: 28,
        isSaving: true,
      };

      const mother = { ...mockMothers.validMother1, nicNumber: '920123456V' };
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      const predictionResponse = {
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'LOW',
          predicted_proba: { Low: 0.85, Medium: 0.10, High: 0.05 },
          feature_vector: {
            Age: 28,
            BMI: 23.9,
            Diastolic: 80,
            Height_cm: 165,
            RuleRiskScore: 0.2,
            Sugar_mg_dL: 90,
            Systolic: 120,
            Weight_kg: 65,
          },
          flags: [],
          override_applied: false,
        },
      };
      mockPredictorClient.predict.mockResolvedValue(predictionResponse);
      
      const createdRecord = {
        id: 'record-new-123',
        bloodPressure: 120,
        weight: 65,
        height: 165,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Regular checkup',
        recordedAt: new Date(),
        updatedAt: new Date(),
        risk: 'LOW',
        motherId: mother.id,
      };
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue(createdRecord);

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(dto);

      // Assert
      expect(mockMotherRepository.findMotherByNic).toHaveBeenCalledWith(dto.motherNic);
      expect(mockPredictorClient.predict).toHaveBeenCalledWith({
        age: 25,
        height_cm: dto.height,
        weight_kg: dto.weight,
        bp_str: dto.bpStr,
        sugar_mg_dL: dto.sugarLevel,
      });
      expect(mockMedicleRecordRepository.createMedicleRecord).toHaveBeenCalledWith({
        bloodPressure: dto.bloodPressure,
        weight: dto.weight,
        height: dto.height,
        sugarLevel: dto.sugarLevel,
        gestationalAge: dto.gestationalAge,
        notes: dto.notes,
        motherId: mother.id,
        motherNic: mother.nicNumber,
        risk: 'LOW',
      });
      expect(result).toEqual({
        record: { id: 'record-new-123', risk: 'LOW' },
        prediction: {
          riskLabel: 'LOW',
          predictedProba: { Low: 0.85, Medium: 0.10, High: 0.05 },
          featureVector: {
            Age: 28,
            BMI: 23.9,
            Diastolic: 80,
            Height_cm: 165,
            RuleRiskScore: 0.2,
            Sugar_mg_dL: 90,
            Systolic: 120,
            Weight_kg: 65,
          },
          flags: [],
          overrideApplied: false,
        },
      });
    });

    it('should handle mother not found error', async () => {
      // Arrange
      const dto = { motherNic: 'invalid-nic', isSaving: false };
      mockMotherRepository.findMotherByNic.mockResolvedValue(null);

      // Act & Assert
      await expect(medicleRecordService.createMedicalRecordAndPredict(dto)).rejects.toThrow('Mother not found');
      expect(mockMotherRepository.findMotherByNic).toHaveBeenCalledWith(dto.motherNic);
    });

    it('should handle prediction without saving', async () => {
      // Arrange
      const dto = {
        motherNic: '920123456V',
        height: 165,
        weight: 65,
        isSaving: false,
      };

      const mother = { ...mockMothers.validMother1, nicNumber: '920123456V' };
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      const predictionResponse = {
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'MEDIUM',
          predicted_proba: { Low: 0.15, Medium: 0.75, High: 0.10 },
          feature_vector: {
            Age: 25,
            BMI: 23.9,
            Diastolic: 70,
            Height_cm: 165,
            RuleRiskScore: 0.4,
            Sugar_mg_dL: 65,
            Systolic: 110,
            Weight_kg: 65,
          },
          flags: [],
          override_applied: false,
        },
      };
      mockPredictorClient.predict.mockResolvedValue(predictionResponse);

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(dto);

      // Assert
      expect(mockMedicleRecordRepository.createMedicleRecord).not.toHaveBeenCalled();
      expect(result).toEqual({
        record: { risk: 'MEDIUM' },
        prediction: {
          riskLabel: 'MEDIUM',
          predictedProba: { Low: 0.15, Medium: 0.75, High: 0.10 },
          featureVector: {
            Age: 25,
            BMI: 23.9,
            Diastolic: 70,
            Height_cm: 165,
            RuleRiskScore: 0.4,
            Sugar_mg_dL: 65,
            Systolic: 110,
            Weight_kg: 65,
          },
          flags: [],
          overrideApplied: false,
        },
      });
    });

    it('should handle predictor service errors', async () => {
      // Arrange
      const dto = {
        motherNic: '920123456V',
        height: 165,
        weight: 65,
        isSaving: true,
      };

      const mother = mockMothers.validMother1;
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      const error = new Error('Predictor service unavailable');
      mockPredictorClient.predict.mockRejectedValue(error);

      // Act & Assert
      await expect(medicleRecordService.createMedicalRecordAndPredict(dto)).rejects.toThrow('Predictor service unavailable');
    });

    it('should normalize risk labels correctly', async () => {
      // Arrange
      const dto = {
        motherNic: '920123456V',
        height: 165,
        weight: 65,
        isSaving: false,
      };

      const mother = mockMothers.validMother1;
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      // Test various prediction responses
      const testCases = [
        { predicted_label: 'low', expected: 'LOW' },
        { predicted_label: 'HIGH', expected: 'HIGH' },
        { predicted_label: 'medium', expected: 'MEDIUM' },
        { predicted_label: 'invalid', expected: 'UNKNOWN' },
        { predicted_label: 'UNKNOWN', expected: 'UNKNOWN' },
      ];

      for (const testCase of testCases) {
        mockPredictorClient.predict.mockResolvedValue({
          code: 200,
          message: 'Success',
          data: {
            predicted_label: testCase.predicted_label,
            predicted_proba: { Low: 0.33, Medium: 0.33, High: 0.34 },
            feature_vector: {
              Age: 25,
              BMI: 23.9,
              Diastolic: 70,
              Height_cm: 165,
              RuleRiskScore: 0.3,
              Sugar_mg_dL: 65,
              Systolic: 110,
              Weight_kg: 65,
            },
            flags: [],
            override_applied: false,
          },
        });

        // Act
        const result = await medicleRecordService.createMedicalRecordAndPredict(dto);

        // Assert
        expect(result.record.risk).toBe(testCase.expected);
        expect(result.prediction.riskLabel).toBe(testCase.expected);
      }
    });

    it('should handle missing dto fields with defaults', async () => {
      // Arrange
      const dto = {
        motherNic: '920123456V',
        isSaving: false,
      };

      const mother = { ...mockMothers.validMother1, dob: new Date('1990-01-01') };
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      mockPredictorClient.predict.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'LOW',
          predicted_proba: { Low: 0.85, Medium: 0.10, High: 0.05 },
          feature_vector: {
            Age: 25,
            BMI: 22.7,
            Diastolic: 70,
            Height_cm: 160,
            RuleRiskScore: 0.2,
            Sugar_mg_dL: 90,
            Systolic: 110,
            Weight_kg: 60,
          },
          flags: [],
          override_applied: false,
        },
      });

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(dto);

      // Assert
      expect(mockPredictorClient.predict).toHaveBeenCalledWith({
        age: 25,
        height_cm: 160,
        weight_kg: 60,
        bp_str: '110/70',
        sugar_mg_dL: 90,
      });
    });
  });
});