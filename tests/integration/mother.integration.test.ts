import { MotherService } from '../../src/services/mother.service';
import { MedicleRecordService } from '../../src/services/medicleRecord.service';
import { PredictorClient } from '../../src/clients/predictor.client';
import { mockDatabase } from '../setup/mockDatabase';
import { mockMothers } from '../mocks/data/mothers.mock';
import { mockMedicalRecords } from '../mocks/data/medicalRecords.mock';
import * as motherRepository from '../../src/repository/mother.repository';
import * as medicleRecordRepository from '../../src/repository/medicleRecord.repository';

// Mock the repositories and predictor client
jest.mock('../../src/repository/mother.repository');
jest.mock('../../src/repository/medicleRecord.repository');
jest.mock('../../src/clients/predictor.client');

const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;
const mockMedicleRecordRepository = medicleRecordRepository as jest.Mocked<typeof medicleRecordRepository>;
const MockedPredictorClient = PredictorClient as jest.MockedClass<typeof PredictorClient>;

describe('Mother Profile Integration Tests', () => {
  let motherService: MotherService;
  let medicleRecordService: MedicleRecordService;
  let mockPredictorClient: jest.Mocked<PredictorClient>;

  beforeEach(() => {
    motherService = new MotherService();
    medicleRecordService = new MedicleRecordService();
    mockPredictorClient = new MockedPredictorClient() as jest.Mocked<PredictorClient>;
    
    // Replace the predictor instance in the service
    (medicleRecordService as any).predictor = mockPredictorClient;
    
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('Mother Profile Management Flow', () => {
    it('should retrieve mother profile and associated data', async () => {
      // Arrange
      const userId = 'user-123';
      const motherId = 'mother-123';
      const motherProfile = mockMothers.validMother1;
      const medicalRecords = [mockMedicalRecords.normalRecord, mockMedicalRecords.incompleteRecord];

      mockMotherRepository.getMotherProfileByUserId.mockResolvedValue(motherProfile);
      mockMedicleRecordRepository.getMedicleRecordListByMotherId.mockResolvedValue(medicalRecords);

      // Act - Step 1: Get mother profile
      const profile = await motherService.getMotherByUserId(userId);
      
      // Act - Step 2: Get medical records for the mother
      const records = await medicleRecordService.getMedicalRecordsByMotherId(motherId);

      // Assert
      expect(mockMotherRepository.getMotherProfileByUserId).toHaveBeenCalledWith(userId);
      expect(profile).toEqual(motherProfile);
      expect(mockMedicleRecordRepository.getMedicleRecordListByMotherId).toHaveBeenCalledWith(motherId);
      expect(records).toEqual(medicalRecords);
    });

    it('should handle mother with no medical records', async () => {
      // Arrange
      const userId = 'user-no-records';
      const motherId = 'mother-no-records';
      const motherProfile = mockMothers.validMother2;

      mockMotherRepository.getMotherProfileByUserId.mockResolvedValue(motherProfile);
      mockMedicleRecordRepository.getMedicleRecordListByMotherId.mockResolvedValue([]);

      // Act
      const profile = await motherService.getMotherByUserId(userId);
      const records = await medicleRecordService.getMedicalRecordsByMotherId(motherId);

      // Assert
      expect(profile).toEqual(motherProfile);
      expect(records).toEqual([]);
    });

    it('should handle non-existent mother profile', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockMotherRepository.getMotherProfileByUserId.mockResolvedValue(null);

      // Act
      const profile = await motherService.getMotherByUserId(userId);

      // Assert
      expect(profile).toBeNull();
      expect(mockMotherRepository.getMotherProfileByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('Medical Record Creation and Prediction Flow', () => {
    it('should complete full medical record creation with prediction', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = { ...mockMothers.validMother1, nicNumber: motherNic };
      const recordData = {
        motherNic,
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

      // Mock mother lookup
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);

      // Mock predictor response
      const predictionResponse = {
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'Low',
          predicted_proba: { Low: 0.85, Medium: 0.12, High: 0.03 },
          feature_vector: {
            Age: 28,
            BMI: 24.5,
            Diastolic: 80,
            Height_cm: 165,
            RuleRiskScore: 1,
            Sugar_mg_dL: 90,
            Systolic: 120,
            Weight_kg: 65,
          },
          flags: [],
          override_applied: false,
        },
      };
      mockPredictorClient.predict.mockResolvedValue(predictionResponse);

      // Mock record creation
      const createdRecord = {
        id: 'record-new-123',
        motherId: mother.id,
        bloodPressure: 120,
        weight: 65,
        height: 165,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Test record',
        recordedAt: new Date(),
        updatedAt: new Date(),
        risk: 'low',
      };
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue(createdRecord);

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(recordData);

      // Assert - Verify complete workflow
      expect(mockMotherRepository.findMotherByNic).toHaveBeenCalledWith(motherNic);
      expect(mockPredictorClient.predict).toHaveBeenCalledWith({
        age: 25, // Default age used in service
        height_cm: recordData.height,
        weight_kg: recordData.weight,
        bp_str: recordData.bpStr,
        sugar_mg_dL: recordData.sugarLevel,
      });
      expect(mockMedicleRecordRepository.createMedicleRecord).toHaveBeenCalledWith({
        bloodPressure: recordData.bloodPressure,
        weight: recordData.weight,
        height: recordData.height,
        sugarLevel: recordData.sugarLevel,
        gestationalAge: recordData.gestationalAge,
        notes: recordData.notes,
        motherId: mother.id,
        motherNic: mother.nicNumber,
        risk: 'LOW', // Normalized from 'Low'
      });

      expect(result).toEqual({
        record: { id: 'record-new-123', risk: 'LOW' },
        prediction: {
          riskLabel: 'LOW',
          predictedProba: predictionResponse.data.predicted_proba,
          featureVector: predictionResponse.data.feature_vector,
          flags: [],
          overrideApplied: false,
        },
      });
    });

    it('should handle prediction without saving record', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      const recordData = {
        motherNic,
        height: 170,
        weight: 70,
        isSaving: false, // Don't save
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      const predictionResponse = {
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'Medium',
          predicted_proba: { Low: 0.25, Medium: 0.60, High: 0.15 },
          feature_vector: {
            Age: 30,
            BMI: 24.2,
            Diastolic: 80,
            Height_cm: 170,
            RuleRiskScore: 2,
            Sugar_mg_dL: 95,
            Systolic: 125,
            Weight_kg: 70,
          },
          flags: [],
          override_applied: false,
        },
      };
      mockPredictorClient.predict.mockResolvedValue(predictionResponse);

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(recordData);

      // Assert
      expect(mockMotherRepository.findMotherByNic).toHaveBeenCalledWith(motherNic);
      expect(mockPredictorClient.predict).toHaveBeenCalled();
      expect(mockMedicleRecordRepository.createMedicleRecord).not.toHaveBeenCalled();

      expect(result).toEqual({
        record: { risk: 'MEDIUM' },
        prediction: {
          riskLabel: 'MEDIUM',
          predictedProba: predictionResponse.data.predicted_proba,
          featureVector: predictionResponse.data.feature_vector,
          flags: [],
          overrideApplied: false,
        },
      });
    });

    it('should handle high-risk prediction workflow', async () => {
      // Arrange
      const motherNic = '880720123V';
      const mother = { ...mockMothers.validMother2, nicNumber: motherNic };
      const recordData = {
        motherNic,
        height: 160,
        weight: 85,
        bloodPressure: 150,
        sugarLevel: 140,
        bpStr: '150/95',
        isSaving: true,
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);

      // Mock high-risk prediction
      const predictionResponse = {
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'High',
          predicted_proba: { Low: 0.05, Medium: 0.25, High: 0.70 },
          feature_vector: {
            Age: 35,
            BMI: 33.2,
            Diastolic: 95,
            Height_cm: 160,
            RuleRiskScore: 4,
            Sugar_mg_dL: 140,
            Systolic: 150,
            Weight_kg: 85,
          },
          flags: ['high_bp', 'elevated_bmi'],
          override_applied: false,
        },
      };
      mockPredictorClient.predict.mockResolvedValue(predictionResponse);
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue({
        id: 'high-risk-record',
        motherId: mother.id,
        bloodPressure: 150,
        weight: 85,
        height: 160,
        sugarLevel: 140,
        gestationalAge: null,
        notes: null,
        recordedAt: new Date(),
        updatedAt: new Date(),
        risk: 'high',
      });

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(recordData);

      // Assert
      expect(mockMedicleRecordRepository.createMedicleRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          risk: 'HIGH',
          motherId: mother.id,
          bloodPressure: 150,
          weight: 85,
        })
      );

      expect(result.record.risk).toBe('HIGH');
      expect(result.prediction.riskLabel).toBe('HIGH');
      expect(result.prediction.flags).toEqual(['high_bp', 'elevated_bmi']);
    });

    it('should handle mother not found error', async () => {
      // Arrange
      const motherNic = 'invalid-nic';
      const recordData = { motherNic, isSaving: false };

      mockMotherRepository.findMotherByNic.mockResolvedValue(null);

      // Act & Assert
      await expect(medicleRecordService.createMedicalRecordAndPredict(recordData))
        .rejects.toThrow('Mother not found');
      
      expect(mockMotherRepository.findMotherByNic).toHaveBeenCalledWith(motherNic);
      expect(mockPredictorClient.predict).not.toHaveBeenCalled();
    });

    it('should handle prediction service failure', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      const recordData = { motherNic, height: 165, weight: 65, isSaving: true };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      mockPredictorClient.predict.mockRejectedValue(new Error('Prediction service unavailable'));

      // Act & Assert
      await expect(medicleRecordService.createMedicalRecordAndPredict(recordData))
        .rejects.toThrow('Prediction service unavailable');

      expect(mockMotherRepository.findMotherByNic).toHaveBeenCalled();
      expect(mockPredictorClient.predict).toHaveBeenCalled();
      expect(mockMedicleRecordRepository.createMedicleRecord).not.toHaveBeenCalled();
    });
  });

  describe('Medical Record Management Flow', () => {
    it('should complete record update workflow', async () => {
      // Arrange
      const recordId = 'record-123';
      const updateData = { weight: 68, bloodPressure: 125 };
      const updatedRecord = { ...mockMedicalRecords.normalRecord, ...updateData };

      mockMedicleRecordRepository.updateMedicleRecordById.mockResolvedValue(updatedRecord);

      // Act
      const result = await medicleRecordService.updateMedicalRecord(recordId, updateData);

      // Assert
      expect(mockMedicleRecordRepository.updateMedicleRecordById)
        .toHaveBeenCalledWith(recordId, updateData);
      expect(result).toEqual(updatedRecord);
    });

    it('should complete record deletion workflow', async () => {
      // Arrange
      const recordId = 'record-to-delete';
      mockMedicleRecordRepository.deleteMedicleRecordById.mockResolvedValue(mockMedicalRecords.normalRecord);

      // Act
      const result = await medicleRecordService.deleteMedicalRecord(recordId);

      // Assert
      expect(mockMedicleRecordRepository.deleteMedicleRecordById)
        .toHaveBeenCalledWith(recordId);
      expect(result).toEqual({ message: 'Medical record deleted successfully' });
    });
  });

  describe('Dashboard Data Aggregation Flow', () => {
    it('should retrieve comprehensive dashboard data', async () => {
      // Arrange
      const mothersCount = 25;
      const highRiskRecords = [
        {
          ...mockMedicalRecords.highRiskRecord,
          mother: {
            ...mockMothers.validMother2,
            user: {
              email: 'mother2@example.com',
              firstName: 'Mother',
              lastName: 'Two',
            },
          },
        },
      ];
      const avgBp = { _avg: { bloodPressure: 125.5 } };
      const avgSugar = { _avg: { sugarLevel: 95.2 } };
      const allRecordsWithMothers = [
        { ...mockMedicalRecords.normalRecord, mother: mockMothers.validMother1 },
        { ...mockMedicalRecords.highRiskRecord, mother: mockMothers.validMother2 },
      ];

      // Mock all repository calls
      mockMotherRepository.getAllMothersCount.mockResolvedValue(mothersCount);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue(highRiskRecords);
      mockMotherRepository.getAvgBp.mockResolvedValue(avgBp);
      mockMotherRepository.getAvgSuger.mockResolvedValue(avgSugar);
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue(allRecordsWithMothers);

      // Act - Get individual statistics
      const totalMothers = await motherService.getAllMothersListCount();
      const highRisk = await motherService.getHighestRiskMedicleRecordsWithMother();
      const avgBpData = await motherService.getAvgBpService();
      const avgSugarData = await motherService.getAvgSugerService();
      const allRecords = await medicleRecordService.getAllMedicleRecordsWithMother();

      // Assert
      expect(totalMothers).toBe(mothersCount);
      expect(highRisk).toEqual(highRiskRecords);
      expect(avgBpData).toEqual(avgBp);
      expect(avgSugarData).toEqual(avgSugar);
      expect(allRecords).toEqual(allRecordsWithMothers);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle repository failures gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      mockMotherRepository.getMotherProfileByUserId.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(motherService.getMotherByUserId(userId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle partial data retrieval', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      const recordData = { motherNic, height: 165, isSaving: true };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      mockPredictorClient.predict.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'Low',
          predicted_proba: { Low: 0.80, Medium: 0.15, High: 0.05 },
          feature_vector: {
            Age: 25,
            BMI: 24.2,
            Diastolic: 75,
            Height_cm: 165,
            RuleRiskScore: 1,
            Sugar_mg_dL: 85,
            Systolic: 115,
            Weight_kg: 65,
          },
          flags: [],
          override_applied: false,
        }, // Minimal response
      });
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue({
        id: 'record-123',
        motherId: mother.id,
        bloodPressure: null,
        weight: null,
        height: 165,
        sugarLevel: null,
        gestationalAge: null,
        notes: null,
        recordedAt: new Date(),
        updatedAt: new Date(),
        risk: 'low',
      });

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(recordData);

      // Assert - Should handle all provided fields properly
      expect(result.prediction.predictedProba).toEqual({ Low: 0.8, Medium: 0.15, High: 0.05 });
      expect(result.prediction.featureVector).toBeDefined();
      expect(result.prediction.flags).toEqual([]);
    });
  });
});