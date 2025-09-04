import { DoctorService } from '../../../src/services/doctor.service';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMothers } from '../../mocks/data/mothers.mock';
import { mockMedicalRecords } from '../../mocks/data/medicalRecords.mock';
import * as medicleRecordRepository from '../../../src/repository/medicleRecord.repository';
import * as motherRepository from '../../../src/repository/mother.repository';

// Mock the repositories
jest.mock('../../../src/repository/medicleRecord.repository');
jest.mock('../../../src/repository/mother.repository');

const mockMedicleRecordRepository = medicleRecordRepository as jest.Mocked<typeof medicleRecordRepository>;
const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;

describe('DoctorService', () => {
  let doctorService: DoctorService;

  beforeEach(() => {
    doctorService = new DoctorService();
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('getDashboardProps', () => {
    it('should retrieve complete dashboard data successfully', async () => {
      // Arrange
      const mockTotalMothersCount = 50;
      const mockHighestRiskRecords = [
        { ...mockMedicalRecords.highRiskRecord, mother: mockMothers.validMother2 },
      ];
      const mockAvgBp = { _avg: { bloodPressure: 125.5 } };
      const mockAvgSugar = { _avg: { sugarLevel: 95.2 } };
      const mockMedicalRecordsWithMother = [
        { ...mockMedicalRecords.normalRecord, mother: mockMothers.validMother1 },
        { ...mockMedicalRecords.highRiskRecord, mother: mockMothers.validMother2 },
        { ...mockMedicalRecords.recentRecord, mother: mockMothers.pregnantMother },
      ];

      mockMotherRepository.getAllMothersCount.mockResolvedValue(mockTotalMothersCount);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue(mockHighestRiskRecords);
      mockMotherRepository.getAvgBp.mockResolvedValue(mockAvgBp);
      mockMotherRepository.getAvgSuger.mockResolvedValue(mockAvgSugar);
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue(mockMedicalRecordsWithMother);

      // Act
      const result = await doctorService.getDashboardProps();

      // Assert
      expect(mockMotherRepository.getAllMothersCount).toHaveBeenCalled();
      expect(mockMotherRepository.getHighestRiskMedicleRecordsWithMother).toHaveBeenCalled();
      expect(mockMotherRepository.getAvgBp).toHaveBeenCalled();
      expect(mockMotherRepository.getAvgSuger).toHaveBeenCalled();
      expect(mockMedicleRecordRepository.getAllMedicleRecordsWithMother).toHaveBeenCalled();

      expect(result).toEqual({
        totalMothersCount: mockTotalMothersCount,
        highestRiskRecords: mockHighestRiskRecords,
        avgBp: mockAvgBp,
        avgSugar: mockAvgSugar,
        medicalRecordsWithMother: mockMedicalRecordsWithMother,
      });
    });

    it('should handle empty dashboard data', async () => {
      // Arrange
      mockMotherRepository.getAllMothersCount.mockResolvedValue(0);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue([]);
      mockMotherRepository.getAvgBp.mockResolvedValue({ _avg: { bloodPressure: 0 } });
      mockMotherRepository.getAvgSuger.mockResolvedValue({ _avg: { sugarLevel: 0 } });
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue([]);

      // Act
      const result = await doctorService.getDashboardProps();

      // Assert
      expect(result).toEqual({
        totalMothersCount: 0,
        highestRiskRecords: [],
        avgBp: { _avg: { bloodPressure: 0 } },
        avgSugar: { _avg: { sugarLevel: 0 } },
        medicalRecordsWithMother: [],
      });
    });

    it('should handle large dataset efficiently', async () => {
      // Arrange
      const largeMothersCount = 1000;
      const largeHighRiskRecords = Array.from({ length: 50 }, (_, i) => ({
        ...mockMedicalRecords.highRiskRecord,
        id: `record-${i}`,
        mother: { ...mockMothers.validMother2, id: `mother-${i}` },
      }));
      const largeMedicalRecords = Array.from({ length: 200 }, (_, i) => ({
        ...mockMedicalRecords.normalRecord,
        id: `record-${i}`,
        mother: { ...mockMothers.validMother1, id: `mother-${i}` },
      }));

      mockMotherRepository.getAllMothersCount.mockResolvedValue(largeMothersCount);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue(largeHighRiskRecords);
      mockMotherRepository.getAvgBp.mockResolvedValue({ _avg: { bloodPressure: 128.7 } });
      mockMotherRepository.getAvgSuger.mockResolvedValue({ _avg: { sugarLevel: 96.8 } });
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue(largeMedicalRecords);

      // Act
      const result = await doctorService.getDashboardProps();

      // Assert
      expect(result.totalMothersCount).toBe(largeMothersCount);
      expect(result.highestRiskRecords).toHaveLength(50);
      expect(result.medicalRecordsWithMother).toHaveLength(200);
    });

    it('should handle individual repository errors', async () => {
      // Test mothers count error
      mockMotherRepository.getAllMothersCount.mockRejectedValue(new Error('Mothers count query failed'));

      await expect(doctorService.getDashboardProps()).rejects.toThrow('Mothers count query failed');

      // Reset and test high risk records error
      jest.clearAllMocks();
      mockMotherRepository.getAllMothersCount.mockResolvedValue(10);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockRejectedValue(new Error('High risk query failed'));

      await expect(doctorService.getDashboardProps()).rejects.toThrow('High risk query failed');

      // Reset and test avg BP error
      jest.clearAllMocks();
      mockMotherRepository.getAllMothersCount.mockResolvedValue(10);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue([]);
      mockMotherRepository.getAvgBp.mockRejectedValue(new Error('Avg BP calculation failed'));

      await expect(doctorService.getDashboardProps()).rejects.toThrow('Avg BP calculation failed');
    });

    it('should handle partial data gracefully', async () => {
      // Arrange - some repositories return null/undefined
      mockMotherRepository.getAllMothersCount.mockResolvedValue(25);
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue(null as any);
      mockMotherRepository.getAvgBp.mockResolvedValue(undefined as any);
      mockMotherRepository.getAvgSuger.mockResolvedValue({ _avg: { sugarLevel: 92.5 } });
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockResolvedValue([{ ...mockMedicalRecords.normalRecord, mother: mockMothers.validMother1 }]);

      // Act
      const result = await doctorService.getDashboardProps();

      // Assert
      expect(result).toEqual({
        totalMothersCount: 25,
        highestRiskRecords: null,
        avgBp: undefined,
        avgSugar: { _avg: { sugarLevel: 92.5 } },
        medicalRecordsWithMother: [mockMedicalRecords.normalRecord],
      });
    });

    it('should call all repository methods in correct order', async () => {
      // Arrange
      const callOrder: string[] = [];
      
      mockMotherRepository.getAllMothersCount.mockImplementation(async () => {
        callOrder.push('getAllMothersCount');
        return 10;
      });
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockImplementation(async () => {
        callOrder.push('getHighestRiskRecords');
        return [];
      });
      mockMotherRepository.getAvgBp.mockImplementation(async () => {
        callOrder.push('getAvgBp');
        return { _avg: { bloodPressure: 120 } };
      });
      mockMotherRepository.getAvgSuger.mockImplementation(async () => {
        callOrder.push('getAvgSugar');
        return { _avg: { sugarLevel: 90 } };
      });
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockImplementation(async () => {
        callOrder.push('getAllMedicleRecordsWithMother');
        return [];
      });

      // Act
      await doctorService.getDashboardProps();

      // Assert
      expect(callOrder).toEqual([
        'getAllMothersCount',
        'getHighestRiskRecords',
        'getAvgBp',
        'getAvgSugar',
        'getAllMedicleRecordsWithMother',
      ]);
    });

    it('should handle concurrent repository calls', async () => {
      // Arrange
      let resolveCount = 0;
      const createDelayedMock = (value: any, delay: number) => 
        jest.fn().mockImplementation(() => 
          new Promise(resolve => {
            setTimeout(() => {
              resolveCount++;
              resolve(value);
            }, delay);
          })
        );

      mockMotherRepository.getAllMothersCount.mockImplementation(createDelayedMock(5, 50));
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockImplementation(createDelayedMock([], 30));
      mockMotherRepository.getAvgBp.mockImplementation(createDelayedMock({ _avg: { bloodPressure: 120 } }, 40));
      mockMotherRepository.getAvgSuger.mockImplementation(createDelayedMock({ _avg: { sugarLevel: 90 } }, 20));
      mockMedicleRecordRepository.getAllMedicleRecordsWithMother.mockImplementation(createDelayedMock([], 60));

      // Act
      const startTime = Date.now();
      const result = await doctorService.getDashboardProps();
      const endTime = Date.now();

      // Assert
      expect(resolveCount).toBe(5);
      expect(result.totalMothersCount).toBe(5);
      // The total time should be roughly the sum of all delays since they're called sequentially
      expect(endTime - startTime).toBeGreaterThan(150); // At least the sum of delays
    });
  });
});