import { MotherService } from '../../../src/services/mother.service';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMothers } from '../../mocks/data/mothers.mock';
import { mockMedicalRecords } from '../../mocks/data/medicalRecords.mock';
import * as motherRepository from '../../../src/repository/mother.repository';

// Mock the mother repository
jest.mock('../../../src/repository/mother.repository');
const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;

describe('MotherService', () => {
  let motherService: MotherService;

  beforeEach(() => {
    motherService = new MotherService();
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('getAllMothersList', () => {
    it('should retrieve all mothers successfully', async () => {
      // Arrange
      const expectedMothers = [mockMothers.validMother1, mockMothers.validMother2];
      mockMotherRepository.getAllMothers.mockResolvedValue(expectedMothers);

      // Act
      const result = await motherService.getAllMothersList();

      // Assert
      expect(mockMotherRepository.getAllMothers).toHaveBeenCalled();
      expect(result).toEqual(expectedMothers);
    });

    it('should return empty array when no mothers exist', async () => {
      // Arrange
      mockMotherRepository.getAllMothers.mockResolvedValue([]);

      // Act
      const result = await motherService.getAllMothersList();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle null response from repository', async () => {
      // Arrange
      mockMotherRepository.getAllMothers.mockResolvedValue(null as any);

      // Act
      const result = await motherService.getAllMothersList();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockMotherRepository.getAllMothers.mockRejectedValue(error);

      // Act & Assert
      await expect(motherService.getAllMothersList()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getMotherByUserId', () => {
    it('should retrieve mother profile by user ID', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedMother = mockMothers.validMother1;
      mockMotherRepository.getMotherProfileByUserId.mockResolvedValue(expectedMother);

      // Act
      const result = await motherService.getMotherByUserId(userId);

      // Assert
      expect(mockMotherRepository.getMotherProfileByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedMother);
    });

    it('should return null for non-existent user ID', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockMotherRepository.getMotherProfileByUserId.mockResolvedValue(null);

      // Act
      const result = await motherService.getMotherByUserId(userId);

      // Assert
      expect(mockMotherRepository.getMotherProfileByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = 'user-123';
      const error = new Error('Mother profile not found');
      mockMotherRepository.getMotherProfileByUserId.mockRejectedValue(error);

      // Act & Assert
      await expect(motherService.getMotherByUserId(userId)).rejects.toThrow('Mother profile not found');
    });

    it('should handle different user IDs correctly', async () => {
      // Arrange
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const mother1 = mockMothers.validMother1;
      const mother2 = mockMothers.validMother2;
      
      mockMotherRepository.getMotherProfileByUserId
        .mockResolvedValueOnce(mother1)
        .mockResolvedValueOnce(mother2);

      // Act
      const result1 = await motherService.getMotherByUserId(userId1);
      const result2 = await motherService.getMotherByUserId(userId2);

      // Assert
      expect(result1).toEqual(mother1);
      expect(result2).toEqual(mother2);
    });
  });

  describe('getAllMothersListCount', () => {
    it('should retrieve mothers count successfully', async () => {
      // Arrange
      const expectedCount = 25;
      mockMotherRepository.getAllMothersCount.mockResolvedValue(expectedCount);

      // Act
      const result = await motherService.getAllMothersListCount();

      // Assert
      expect(mockMotherRepository.getAllMothersCount).toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it('should handle zero count', async () => {
      // Arrange
      mockMotherRepository.getAllMothersCount.mockResolvedValue(0);

      // Act
      const result = await motherService.getAllMothersListCount();

      // Assert
      expect(result).toBe(0);
    });

    it('should handle null response gracefully', async () => {
      // Arrange
      mockMotherRepository.getAllMothersCount.mockResolvedValue(null as any);

      // Act
      const result = await motherService.getAllMothersListCount();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getHighestRiskMedicleRecordsWithMother', () => {
    it('should retrieve high-risk records with mother data', async () => {
      // Arrange
      const expectedData = [
        {
          ...mockMedicalRecords.highRiskRecord,
          mother: {
            ...mockMothers.validMother2,
            user: {
              email: 'mother2@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
            },
          },
        },
      ];
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue(expectedData);

      // Act
      const result = await motherService.getHighestRiskMedicleRecordsWithMother();

      // Assert
      expect(mockMotherRepository.getHighestRiskMedicleRecordsWithMother).toHaveBeenCalled();
      expect(result).toEqual(expectedData);
    });

    it('should handle empty high-risk records', async () => {
      // Arrange
      mockMotherRepository.getHighestRiskMedicleRecordsWithMother.mockResolvedValue([]);

      // Act
      const result = await motherService.getHighestRiskMedicleRecordsWithMother();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getAvgBpService', () => {
    it('should retrieve average blood pressure successfully', async () => {
      // Arrange
      const expectedAvgBp = { _avg: { bloodPressure: 125.5 } };
      mockMotherRepository.getAvgBp.mockResolvedValue(expectedAvgBp);

      // Act
      const result = await motherService.getAvgBpService();

      // Assert
      expect(mockMotherRepository.getAvgBp).toHaveBeenCalled();
      expect(result).toEqual(expectedAvgBp);
    });

    it('should handle no blood pressure data', async () => {
      // Arrange
      mockMotherRepository.getAvgBp.mockResolvedValue(null as any);

      // Act
      const result = await motherService.getAvgBpService();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Failed to calculate average BP');
      mockMotherRepository.getAvgBp.mockRejectedValue(error);

      // Act & Assert
      await expect(motherService.getAvgBpService()).rejects.toThrow('Failed to calculate average BP');
    });
  });

  describe('getAvgSugerService', () => {
    it('should retrieve average sugar level successfully', async () => {
      // Arrange
      const expectedAvgSugar = { _avg: { sugarLevel: 95.2 } };
      mockMotherRepository.getAvgSuger.mockResolvedValue(expectedAvgSugar);

      // Act
      const result = await motherService.getAvgSugerService();

      // Assert
      expect(mockMotherRepository.getAvgSuger).toHaveBeenCalled();
      expect(result).toEqual(expectedAvgSugar);
    });

    it('should handle no sugar level data', async () => {
      // Arrange
      mockMotherRepository.getAvgSuger.mockResolvedValue(null as any);

      // Act
      const result = await motherService.getAvgSugerService();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Failed to calculate average sugar');
      mockMotherRepository.getAvgSuger.mockRejectedValue(error);

      // Act & Assert
      await expect(motherService.getAvgSugerService()).rejects.toThrow('Failed to calculate average sugar');
    });

    it('should handle edge cases with zero data points', async () => {
      // Arrange
      const zeroData = { _avg: { sugarLevel: 0 } };
      mockMotherRepository.getAvgSuger.mockResolvedValue(zeroData);

      // Act
      const result = await motherService.getAvgSugerService();

      // Assert
      expect(result).toEqual(zeroData);
    });
  });
});