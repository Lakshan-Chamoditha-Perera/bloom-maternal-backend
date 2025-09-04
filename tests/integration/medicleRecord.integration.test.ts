import { MedicleRecordService } from '../../src/services/medicleRecord.service';
import { PredictorClient } from '../../src/clients/predictor.client';
import { mockDatabase } from '../setup/mockDatabase';
import { mockMothers } from '../mocks/data/mothers.mock';
import { mockMedicalRecords } from '../mocks/data/medicalRecords.mock';
import * as medicleRecordRepository from '../../src/repository/medicleRecord.repository';
import * as motherRepository from '../../src/repository/mother.repository';

// Mock the repositories and predictor client
jest.mock('../../src/repository/medicleRecord.repository');
jest.mock('../../src/repository/mother.repository');
jest.mock('../../src/clients/predictor.client');

const mockMedicleRecordRepository = medicleRecordRepository as jest.Mocked<typeof medicleRecordRepository>;
const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;
const MockedPredictorClient = PredictorClient as jest.MockedClass<typeof PredictorClient>;

describe('Medical Records Integration Tests', () => {
  let medicleRecordService: MedicleRecordService;
  let mockPredictorClient: jest.Mocked<PredictorClient>;

  beforeEach(() => {
    medicleRecordService = new MedicleRecordService();
    mockPredictorClient = new MockedPredictorClient() as jest.Mocked<PredictorClient>;
    
    // Replace the predictor instance in the service
    (medicleRecordService as any).predictor = mockPredictorClient;
    
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('Complete Medical Record Lifecycle', () => {
    it('should handle full medical record lifecycle with predictions', async () => {
      // Arrange - Initial record creation
      const motherNic = '920123456V';
      const mother = { ...mockMothers.validMother1, nicNumber: motherNic };
      const initialRecordData = {
        motherNic,
        height: 165,
        weight: 65,
        bloodPressure: 120,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Initial checkup',
        bpStr: '120/80',
        isSaving: true,
      };

      // Mock initial creation
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      mockPredictorClient.predict.mockResolvedValue({
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
      });
      const createdRecord = { ...mockMedicalRecords.normalRecord, id: 'record-lifecycle-test' };
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue(createdRecord);

      // Step 1: Create record with prediction
      const createResult = await medicleRecordService.createMedicalRecordAndPredict(initialRecordData);

      expect(createResult.record.risk).toBe('LOW');
      expect(createResult.prediction.riskLabel).toBe('LOW');

      // Step 2: Retrieve records for the mother
      const motherId = 'mother-123';
      const motherRecords = [createdRecord, mockMedicalRecords.incompleteRecord];
      mockMedicleRecordRepository.getMedicleRecordListByMotherId.mockResolvedValue(motherRecords);

      const retrievedRecords = await medicleRecordService.getMedicalRecordsByMotherId(motherId);
      expect(retrievedRecords).toEqual(motherRecords);

      // Step 3: Update the record
      const updateData = { weight: 70, bloodPressure: 130 };
      const updatedRecord = { ...createdRecord, ...updateData };
      mockMedicleRecordRepository.updateMedicleRecordById.mockResolvedValue(updatedRecord);

      const updateResult = await medicleRecordService.updateMedicalRecord(createdRecord.id, updateData);
      expect(updateResult).toEqual(updatedRecord);

      // Step 4: Delete the record
      mockMedicleRecordRepository.deleteMedicleRecordById.mockResolvedValue(createdRecord);

      const deleteResult = await medicleRecordService.deleteMedicalRecord(createdRecord.id);
      expect(deleteResult).toEqual({ message: 'Medical record deleted successfully' });
    });

    it('should handle multiple predictions with different risk levels', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);

      const testCases = [
        {
          data: { motherNic, height: 165, weight: 60, bpStr: '110/70', isSaving: false },
          prediction: 'Low',
          expectedRisk: 'LOW',
        },
        {
          data: { motherNic, height: 160, weight: 75, bpStr: '135/85', isSaving: false },
          prediction: 'Medium',
          expectedRisk: 'MEDIUM',
        },
        {
          data: { motherNic, height: 155, weight: 90, bpStr: '150/95', isSaving: false },
          prediction: 'High',
          expectedRisk: 'HIGH',
        },
      ];

      for (const testCase of testCases) {
        // Mock prediction response
        mockPredictorClient.predict.mockResolvedValue({
          code: 200,
          message: 'Success',
          data: {
            predicted_label: testCase.prediction,
            predicted_proba: { Low: 0.33, Medium: 0.33, High: 0.34 },
            feature_vector: {
              Age: 30,
              BMI: 25,
              Diastolic: 80,
              Height_cm: 165,
              RuleRiskScore: 2,
              Sugar_mg_dL: 95,
              Systolic: 120,
              Weight_kg: 70,
            },
            flags: [],
            override_applied: false,
          },
        });

        // Act
        const result = await medicleRecordService.createMedicalRecordAndPredict(testCase.data);

        // Assert
        expect(result.record.risk).toBe(testCase.expectedRisk);
        expect(result.prediction.riskLabel).toBe(testCase.expectedRisk);
      }
    });
  });

  describe('Batch Operations and Data Aggregation', () => {
    it('should retrieve all medical records with mother information', async () => {
      // Arrange
      const recordsWithMothers = [
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

      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue(recordsWithMothers);

      // Act
      const result = await medicleRecordService.getAllMedicleRecordsWithMother();

      // Assert
      expect(mockMedicleRecordRepository.getAllMedicleRecordsWithMother).toHaveBeenCalled();
      expect(result).toEqual(recordsWithMothers);
      expect(result).toHaveLength(3);
      
      // Verify each record has mother information
      result.forEach((record) => {
        expect(record.mother).toBeDefined();
        expect(record.mother.id).toBeTruthy();
      });
    });

    it('should handle large batch operations efficiently', async () => {
      // Arrange - Simulate many records for multiple mothers
      const motherId1 = 'mother-batch-1';
      const motherId2 = 'mother-batch-2';
      
      const largeRecordSet1 = Array.from({ length: 50 }, (_, i) => ({
        ...mockMedicalRecords.normalRecord,
        id: `record-${motherId1}-${i}`,
        motherId: motherId1,
      }));
      
      const largeRecordSet2 = Array.from({ length: 30 }, (_, i) => ({
        ...mockMedicalRecords.highRiskRecord,
        id: `record-${motherId2}-${i}`,
        motherId: motherId2,
      }));

      mockMedicleRecordRepository.getMedicleRecordListByMotherId
        .mockResolvedValueOnce(largeRecordSet1)
        .mockResolvedValueOnce(largeRecordSet2);

      // Act
      const records1 = await medicleRecordService.getMedicalRecordsByMotherId(motherId1);
      const records2 = await medicleRecordService.getMedicalRecordsByMotherId(motherId2);

      // Assert
      expect(records1).toHaveLength(50);
      expect(records2).toHaveLength(30);
      expect(records1.every(r => r.motherId === motherId1)).toBe(true);
      expect(records2.every(r => r.motherId === motherId2)).toBe(true);
    });
  });

  describe('Risk Assessment Workflow', () => {
    it('should handle complex risk assessment scenarios', async () => {
      // Arrange - High-risk scenario with multiple risk factors
      const motherNic = '880720123V';
      const mother = { ...mockMothers.validMother2, nicNumber: motherNic };
      const riskData = {
        motherNic,
        height: 155,
        weight: 95,
        bloodPressure: 160,
        sugarLevel: 150,
        gestationalAge: 35,
        notes: 'Multiple risk factors present',
        bpStr: '160/100',
        age: 38,
        isSaving: true,
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      // Mock high-risk prediction with detailed response
      mockPredictorClient.predict.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'High',
          predicted_proba: { Low: 0.02, Medium: 0.18, High: 0.80 },
          feature_vector: {
            Age: 38,
            BMI: 39.5,
            Diastolic: 100,
            Height_cm: 155,
            RuleRiskScore: 4,
            Sugar_mg_dL: 150,
            Systolic: 160,
            Weight_kg: 95,
          },
          flags: ['high_bp', 'obesity', 'advanced_age', 'gestational_diabetes_risk'],
          override_applied: false,
        },
      });

      const highRiskRecord = {
        id: 'high-risk-record-complex',
        motherId: mother.id,
        bloodPressure: 160,
        weight: 95,
        height: 155,
        sugarLevel: 150,
        gestationalAge: 35,
        notes: 'Multiple risk factors present',
        recordedAt: new Date(),
        updatedAt: new Date(),
        risk: 'high',
      };
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue(highRiskRecord);

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(riskData);

      // Assert
      expect(result.record.risk).toBe('HIGH');
      expect(result.prediction.riskLabel).toBe('HIGH');
      expect(result.prediction.flags).toEqual([
        'high_bp',
        'obesity',
        'advanced_age',
        'gestational_diabetes_risk',
      ]);
      expect(result.prediction.predictedProba.High).toBeGreaterThan(0.7);

      // Verify record was created with high risk flag
      expect(mockMedicleRecordRepository.createMedicleRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          risk: 'HIGH',
          motherId: mother.id,
          bloodPressure: 160,
          weight: 95,
          gestationalAge: 35,
        })
      );
    });

    it('should handle borderline risk cases', async () => {
      // Arrange - Borderline case that could go either way
      const motherNic = '951110789V';
      const mother = { ...mockMothers.pregnantMother, nicNumber: motherNic };
      const borderlineData = {
        motherNic,
        height: 165,
        weight: 70,
        bloodPressure: 125,
        sugarLevel: 95,
        bpStr: '125/82',
        isSaving: false,
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      // Mock borderline prediction
      mockPredictorClient.predict.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'Medium',
          predicted_proba: { Low: 0.45, Medium: 0.50, High: 0.05 },
          feature_vector: {
            Age: 28,
            BMI: 25.7,
            Diastolic: 82,
            Height_cm: 165,
            RuleRiskScore: 2,
            Sugar_mg_dL: 95,
            Systolic: 125,
            Weight_kg: 70,
          },
          flags: ['borderline_bp'],
          override_applied: false,
        },
      });

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(borderlineData);

      // Assert
      expect(result.record.risk).toBe('MEDIUM');
      expect(result.prediction.riskLabel).toBe('MEDIUM');
      expect(result.prediction.flags).toEqual(['borderline_bp']);
      
      // Should not save record when isSaving is false
      expect(mockMedicleRecordRepository.createMedicleRecord).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle prediction service failures with appropriate fallback', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      const recordData = {
        motherNic,
        height: 165,
        weight: 65,
        isSaving: true,
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      // Simulate prediction service failure
      mockPredictorClient.predict.mockRejectedValue(new Error('Prediction service timeout'));

      // Act & Assert
      await expect(medicleRecordService.createMedicalRecordAndPredict(recordData))
        .rejects.toThrow('Prediction service timeout');

      // Verify that record creation was not attempted
      expect(mockMedicleRecordRepository.createMedicleRecord).not.toHaveBeenCalled();
    });

    it('should handle database consistency during complex operations', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      const recordData = {
        motherNic,
        height: 165,
        weight: 65,
        isSaving: true,
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      mockPredictorClient.predict.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'Low',
          predicted_proba: { Low: 0.70, Medium: 0.25, High: 0.05 },
          feature_vector: {
            Age: 25,
            BMI: 23.4,
            Diastolic: 70,
            Height_cm: 160,
            RuleRiskScore: 1,
            Sugar_mg_dL: 85,
            Systolic: 110,
            Weight_kg: 60,
          },
          flags: [],
          override_applied: false,
        },
      });

      // Simulate database failure during record creation
      mockMedicleRecordRepository.createMedicleRecord.mockRejectedValue(
        new Error('Database constraint violation')
      );

      // Act & Assert
      await expect(medicleRecordService.createMedicalRecordAndPredict(recordData))
        .rejects.toThrow('Database constraint violation');

      // Verify prediction was called but record creation failed
      expect(mockPredictorClient.predict).toHaveBeenCalled();
      expect(mockMedicleRecordRepository.createMedicleRecord).toHaveBeenCalled();
    });

    it('should handle concurrent record operations', async () => {
      // Arrange
      const recordIds = ['record-1', 'record-2', 'record-3'];
      const updateOperations = recordIds.map((id, index) => ({
        id,
        data: { weight: 65 + index, bloodPressure: 120 + index * 5 },
        result: { ...mockMedicalRecords.normalRecord, id, weight: 65 + index },
      }));

      // Mock concurrent updates
      updateOperations.forEach((op) => {
        mockMedicleRecordRepository.updateMedicleRecordById
          .mockResolvedValueOnce(op.result);
      });

      // Act - Simulate concurrent updates
      const updatePromises = updateOperations.map((op) =>
        medicleRecordService.updateMedicalRecord(op.id, op.data)
      );
      
      const results = await Promise.all(updatePromises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toEqual(updateOperations[index].result);
      });
      expect(mockMedicleRecordRepository.updateMedicleRecordById).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should handle edge cases in medical data', async () => {
      // Arrange
      const motherNic = '920123456V';
      const mother = mockMothers.validMother1;
      const edgeCaseData = {
        motherNic,
        height: null, // Missing height
        weight: undefined, // Missing weight
        bloodPressure: '', // Empty string
        sugarLevel: 'invalid', // Invalid data type
        gestationalAge: -5, // Invalid negative value
        isSaving: true,
      };

      mockMotherRepository.findMotherByNic.mockResolvedValue(mother);
      
      // Service should handle these gracefully with defaults
      mockPredictorClient.predict.mockResolvedValue({
        code: 200,
        message: 'Success',
        data: {
          predicted_label: 'Unknown',
          predicted_proba: { Low: 0.33, Medium: 0.33, High: 0.34 },
          feature_vector: {
            Age: 25,
            BMI: 23.4,
            Diastolic: 70,
            Height_cm: 160,
            RuleRiskScore: 0,
            Sugar_mg_dL: 85,
            Systolic: 110,
            Weight_kg: 60,
          },
          flags: ['incomplete_data'],
          override_applied: true,
        },
      });

      const recordWithDefaults = {
        id: 'edge-case-record',
        motherId: mother.id,
        bloodPressure: 110,
        weight: 60,
        height: 160,
        sugarLevel: 85,
        gestationalAge: null,
        notes: 'Edge case with defaults',
        recordedAt: new Date(),
        updatedAt: new Date(),
        risk: 'unknown',
      };
      mockMedicleRecordRepository.createMedicleRecord.mockResolvedValue(recordWithDefaults);

      // Act
      const result = await medicleRecordService.createMedicalRecordAndPredict(edgeCaseData);

      // Assert - Service should normalize risk and handle defaults
      expect(result.record.risk).toBe('UNKNOWN');
      expect(result.prediction.riskLabel).toBe('UNKNOWN');

      // Verify predictor was called with actual values (service doesn't sanitize)
      expect(mockPredictorClient.predict).toHaveBeenCalledWith({
        age: 25,
        height_cm: 160, // Default
        weight_kg: 60,  // Default
        bp_str: '110/70', // Default
        sugar_mg_dL: 'invalid', // Service passes raw value
      });
    });
  });
});