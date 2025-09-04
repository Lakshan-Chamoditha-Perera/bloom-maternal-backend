import {
  createMotherProfile,
  getMotherProfileById,
  getMotherProfileByUserId,
  getAllMothers,
  findMotherById,
  findMotherByNic,
  getAllMothersCount,
  getHighestRiskMedicleRecordsWithMother,
  getAvgBp,
  getAvgSuger,
} from '../../../src/repository/mother.repository';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMothers } from '../../mocks/data/mothers.mock';
import { mockMedicalRecords } from '../../mocks/data/medicalRecords.mock';
import { mockUsers } from '../../mocks/data/users.mock';
import { mockPrismaClient } from '../../mocks/prisma.mock';

describe('MotherRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('createMotherProfile', () => {
    it('should create mother profile successfully', async () => {
      // Arrange
      const motherData = {
        userId: 'user-123',
        dob: new Date('1992-03-15'),
        nicNumber: '920123456V',
        phone: '+94773456789',
        address: '123 Main St, Colombo',
      };
      const expectedMother = { ...mockMothers.validMother1, ...motherData };
      mockPrismaClient.mother.create.mockResolvedValue(expectedMother);

      // Act
      const result = await createMotherProfile(motherData);

      // Assert
      expect(mockPrismaClient.mother.create).toHaveBeenCalledWith({
        data: {
          userId: motherData.userId,
          dob: motherData.dob,
          nicNumber: motherData.nicNumber,
          phone: motherData.phone,
          address: motherData.address,
        }
      });
      expect(result).toEqual(expectedMother);
    });

    it('should create mother profile with null optional fields', async () => {
      // Arrange
      const motherData = {
        userId: 'user-456',
        dob: new Date('1988-07-20'),
        nicNumber: '880720123V',
        phone: undefined,
        address: undefined,
      };
      const expectedMother = { ...mockMothers.validMother2, phone: null, address: null };
      mockPrismaClient.mother.create.mockResolvedValue(expectedMother);

      // Act
      const result = await createMotherProfile(motherData);

      // Assert
      expect(mockPrismaClient.mother.create).toHaveBeenCalledWith({
        data: {
          userId: motherData.userId,
          dob: motherData.dob,
          nicNumber: motherData.nicNumber,
          phone: null,
          address: null,
        }
      });
      expect(result).toEqual(expectedMother);
    });

    it('should handle prisma creation errors', async () => {
      // Arrange
      const motherData = {
        userId: 'user-error',
        dob: new Date('1990-01-01'),
        nicNumber: 'duplicate-nic',
      };
      const error = new Error('Unique constraint failed on nicNumber');
      mockPrismaClient.mother.create.mockRejectedValue(error);

      // Act & Assert
      await expect(createMotherProfile(motherData)).rejects.toThrow('Unique constraint failed on nicNumber');
    });
  });

  describe('getMotherProfileById', () => {
    it('should find mother profile by ID', async () => {
      // Arrange
      const motherId = 'mother-123';
      const expectedMother = mockMothers.validMother1;
      mockPrismaClient.mother.findUnique.mockResolvedValue(expectedMother);

      // Act
      const result = await getMotherProfileById(motherId);

      // Assert
      expect(mockPrismaClient.mother.findUnique).toHaveBeenCalledWith({
        where: { id: motherId }
      });
      expect(result).toEqual(expectedMother);
    });

    it('should return null for non-existent mother ID', async () => {
      // Arrange
      const motherId = 'non-existent-mother';
      mockPrismaClient.mother.findUnique.mockResolvedValue(null);

      // Act
      const result = await getMotherProfileById(motherId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getMotherProfileByUserId', () => {
    it('should find mother profile by user ID', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedMother = mockMothers.validMother1;
      mockPrismaClient.mother.findUnique.mockResolvedValue(expectedMother);

      // Act
      const result = await getMotherProfileByUserId(userId);

      // Assert
      expect(mockPrismaClient.mother.findUnique).toHaveBeenCalledWith({
        where: { userId }
      });
      expect(result).toEqual(expectedMother);
    });

    it('should return null for non-existent user ID', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockPrismaClient.mother.findUnique.mockResolvedValue(null);

      // Act
      const result = await getMotherProfileByUserId(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllMothers', () => {
    it('should retrieve all mothers', async () => {
      // Arrange
      const expectedMothers = [mockMothers.validMother1, mockMothers.validMother2, mockMothers.pregnantMother];
      mockPrismaClient.mother.findMany.mockResolvedValue(expectedMothers);

      // Act
      const result = await getAllMothers();

      // Assert
      expect(mockPrismaClient.mother.findMany).toHaveBeenCalled();
      expect(result).toEqual(expectedMothers);
    });

    it('should return empty array when no mothers exist', async () => {
      // Arrange
      mockPrismaClient.mother.findMany.mockResolvedValue([]);

      // Act
      const result = await getAllMothers();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findMotherById', () => {
    it('should find mother by ID', async () => {
      // Arrange
      const motherId = 'mother-456';
      const expectedMother = mockMothers.validMother2;
      mockPrismaClient.mother.findUnique.mockResolvedValue(expectedMother);

      // Act
      const result = await findMotherById(motherId);

      // Assert
      expect(mockPrismaClient.mother.findUnique).toHaveBeenCalledWith({
        where: { id: motherId }
      });
      expect(result).toEqual(expectedMother);
    });
  });

  describe('findMotherByNic', () => {
    it('should find mother by NIC number', async () => {
      // Arrange
      const nicNumber = '920123456V';
      const expectedMother = mockMothers.validMother1;
      mockPrismaClient.mother.findUnique.mockResolvedValue(expectedMother);

      // Act
      const result = await findMotherByNic(nicNumber);

      // Assert
      expect(mockPrismaClient.mother.findUnique).toHaveBeenCalledWith({
        where: { nicNumber }
      });
      expect(result).toEqual(expectedMother);
    });

    it('should return null for non-existent NIC', async () => {
      // Arrange
      const nicNumber = 'invalid-nic';
      mockPrismaClient.mother.findUnique.mockResolvedValue(null);

      // Act
      const result = await findMotherByNic(nicNumber);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle different NIC formats', async () => {
      // Arrange
      const nicNumbers = ['920123456V', '880720123X', '951110789V'];
      
      for (const nic of nicNumbers) {
        mockPrismaClient.mother.findUnique.mockResolvedValue(mockMothers.validMother1);
        
        // Act
        const result = await findMotherByNic(nic);
        
        // Assert
        expect(mockPrismaClient.mother.findUnique).toHaveBeenCalledWith({
          where: { nicNumber: nic }
        });
        expect(result).toEqual(mockMothers.validMother1);
      }
    });
  });

  describe('getAllMothersCount', () => {
    it('should return correct mothers count', async () => {
      // Arrange
      const expectedCount = 25;
      mockPrismaClient.mother.count.mockResolvedValue(expectedCount);

      // Act
      const result = await getAllMothersCount();

      // Assert
      expect(mockPrismaClient.mother.count).toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it('should return zero when no mothers exist', async () => {
      // Arrange
      mockPrismaClient.mother.count.mockResolvedValue(0);

      // Act
      const result = await getAllMothersCount();

      // Assert
      expect(result).toBe(0);
    });

    it('should handle large counts', async () => {
      // Arrange
      const expectedCount = 1000;
      mockPrismaClient.mother.count.mockResolvedValue(expectedCount);

      // Act
      const result = await getAllMothersCount();

      // Assert
      expect(result).toBe(expectedCount);
    });
  });

  describe('getHighestRiskMedicleRecordsWithMother', () => {
    it('should retrieve high-risk medical records with mother data', async () => {
      // Arrange
      const expectedRecords = [
        {
          ...mockMedicalRecords.highRiskRecord,
          mother: {
            ...mockMothers.validMother2,
            user: {
              firstName: 'Dr. John',
              lastName: 'Smith',
              email: 'clinic@test.com',
            },
          },
        },
      ];
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(expectedRecords);

      // Act
      const result = await getHighestRiskMedicleRecordsWithMother();

      // Assert
      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalledWith({
        where: {
          risk: 'high'
        },
        include: {
          mother: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          recordedAt: 'desc'
        }
      });
      expect(result).toEqual(expectedRecords);
    });

    it('should return empty array when no high-risk records exist', async () => {
      // Arrange
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue([]);

      // Act
      const result = await getHighestRiskMedicleRecordsWithMother();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle multiple high-risk records', async () => {
      // Arrange
      const multipleRecords = [
        { ...mockMedicalRecords.highRiskRecord, id: 'record-1' },
        { ...mockMedicalRecords.highRiskRecord, id: 'record-2' },
        { ...mockMedicalRecords.highRiskRecord, id: 'record-3' },
      ];
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(multipleRecords);

      // Act
      const result = await getHighestRiskMedicleRecordsWithMother();

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual(multipleRecords);
    });
  });

  describe('getAvgBp', () => {
    it('should calculate average blood pressure', async () => {
      // Arrange
      const expectedAvg = { _avg: { bloodPressure: 125.5 } };
      mockPrismaClient.medicalRecord.aggregate.mockResolvedValue(expectedAvg);

      // Act
      const result = await getAvgBp();

      // Assert
      expect(mockPrismaClient.medicalRecord.aggregate).toHaveBeenCalledWith({
        _avg: {
          bloodPressure: true
        }
      });
      expect(result).toEqual(expectedAvg);
    });

    it('should handle null average when no records exist', async () => {
      // Arrange
      const expectedAvg = { _avg: { bloodPressure: null } };
      mockPrismaClient.medicalRecord.aggregate.mockResolvedValue(expectedAvg);

      // Act
      const result = await getAvgBp();

      // Assert
      expect(result).toEqual(expectedAvg);
    });

    it('should handle edge cases with extreme values', async () => {
      // Arrange
      const expectedAvg = { _avg: { bloodPressure: 200.0 } };
      mockPrismaClient.medicalRecord.aggregate.mockResolvedValue(expectedAvg);

      // Act
      const result = await getAvgBp();

      // Assert
      expect(result).toEqual(expectedAvg);
    });
  });

  describe('getAvgSuger', () => {
    it('should calculate average sugar level', async () => {
      // Arrange
      const expectedAvg = { _avg: { sugarLevel: 95.8 } };
      mockPrismaClient.medicalRecord.aggregate.mockResolvedValue(expectedAvg);

      // Act
      const result = await getAvgSuger();

      // Assert
      expect(mockPrismaClient.medicalRecord.aggregate).toHaveBeenCalledWith({
        _avg: {
          sugarLevel: true
        }
      });
      expect(result).toEqual(expectedAvg);
    });

    it('should handle null average when no sugar level data exists', async () => {
      // Arrange
      const expectedAvg = { _avg: { sugarLevel: null } };
      mockPrismaClient.medicalRecord.aggregate.mockResolvedValue(expectedAvg);

      // Act
      const result = await getAvgSuger();

      // Assert
      expect(result).toEqual(expectedAvg);
    });

    it('should handle zero average', async () => {
      // Arrange
      const expectedAvg = { _avg: { sugarLevel: 0.0 } };
      mockPrismaClient.medicalRecord.aggregate.mockResolvedValue(expectedAvg);

      // Act
      const result = await getAvgSuger();

      // Assert
      expect(result).toEqual(expectedAvg);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const error = new Error('Database aggregation failed');
      mockPrismaClient.medicalRecord.aggregate.mockRejectedValue(error);

      // Act & Assert
      await expect(getAvgSuger()).rejects.toThrow('Database aggregation failed');
    });
  });
});