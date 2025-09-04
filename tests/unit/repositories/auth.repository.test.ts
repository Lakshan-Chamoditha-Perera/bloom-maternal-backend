import { findUserByEmail, createUser } from '../../../src/repository/auth.repository';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockUsers } from '../../mocks/data/users.mock';
import { mockPrismaClient } from '../../mocks/prisma.mock';
import { Role } from '../../../src/types/dtos/types';

describe('AuthRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('findUserByEmail', () => {
    it('should find user by email successfully', async () => {
      // Arrange
      const email = 'mother@test.com';
      const expectedUser = mockUsers.validMother;
      mockPrismaClient.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await findUserByEmail(email);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const email = 'nonexistent@test.com';
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await findUserByEmail(email);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
      expect(result).toBeNull();
    });

    it('should handle different email formats', async () => {
      // Arrange
      const emails = [
        'user@example.com',
        'test.user+tag@domain.co.uk',
        'UPPERCASE@DOMAIN.COM',
        'user123@test-domain.org'
      ];

      for (const email of emails) {
        mockPrismaClient.user.findUnique.mockResolvedValue(mockUsers.validMother);

        // Act
        const result = await findUserByEmail(email);

        // Assert
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { email }
        });
        expect(result).toEqual(mockUsers.validMother);
      }
    });

    it('should handle prisma errors', async () => {
      // Arrange
      const email = 'test@test.com';
      const error = new Error('Database connection failed');
      mockPrismaClient.user.findUnique.mockRejectedValue(error);

      // Act & Assert
      await expect(findUserByEmail(email)).rejects.toThrow('Database connection failed');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
    });

    it('should handle empty email string', async () => {
      // Arrange
      const email = '';
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await findUserByEmail(email);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: '' }
      });
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@test.com',
        password: 'hashedPassword123',
        role: 'MOTHER' as const,
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const expectedUser = { ...mockUsers.validMother, ...userData };
      mockPrismaClient.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await createUser(userData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      });
      expect(result).toEqual(expectedUser);
    });

    it('should create user with minimal required fields', async () => {
      // Arrange
      const userData = {
        email: 'minimal@test.com',
        password: 'hashedPassword123',
        role: 'CLINIC_USER' as const,
      };
      const expectedUser = { ...mockUsers.validClinicUser, ...userData };
      mockPrismaClient.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await createUser(userData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle MOTHER role creation', async () => {
      // Arrange
      const userData = {
        email: 'mother@test.com',
        password: 'hashedPassword123',
        role: 'MOTHER' as const,
        firstName: 'Mother',
        lastName: 'User',
      };
      const expectedUser = { ...mockUsers.validMother, role: Role.MOTHER };
      mockPrismaClient.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await createUser(userData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle CLINIC_USER role creation', async () => {
      // Arrange
      const userData = {
        email: 'clinic@test.com',
        password: 'hashedPassword123',
        role: 'CLINIC_USER' as const,
        firstName: 'Clinic',
        lastName: 'User',
      };
      const expectedUser = { ...mockUsers.validClinicUser, role: Role.CLINIC_USER };
      mockPrismaClient.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await createUser(userData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle optional fields correctly', async () => {
      // Arrange
      const userData = {
        email: 'optional@test.com',
        password: 'hashedPassword123',
        role: 'MOTHER' as const,
        firstName: undefined,
        lastName: undefined,
      };
      const expectedUser = { ...mockUsers.validMother, firstName: undefined, lastName: undefined };
      mockPrismaClient.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await createUser(userData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle prisma creation errors', async () => {
      // Arrange
      const userData = {
        email: 'error@test.com',
        password: 'hashedPassword123',
        role: 'MOTHER' as const,
      };
      const error = new Error('Email already exists');
      mockPrismaClient.user.create.mockRejectedValue(error);

      // Act & Assert
      await expect(createUser(userData)).rejects.toThrow('Email already exists');
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData
      });
    });

    it('should handle constraint violation errors', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@test.com',
        password: 'hashedPassword123',
        role: 'MOTHER' as const,
      };
      const error = new Error('Unique constraint failed');
      mockPrismaClient.user.create.mockRejectedValue(error);

      // Act & Assert
      await expect(createUser(userData)).rejects.toThrow('Unique constraint failed');
    });

    it('should create users with different roles sequentially', async () => {
      // Arrange
      const motherData = {
        email: 'mother@test.com',
        password: 'hashedPassword123',
        role: 'MOTHER' as const,
        firstName: 'Mother',
        lastName: 'User',
      };
      
      const clinicData = {
        email: 'clinic@test.com',
        password: 'hashedPassword123',
        role: 'CLINIC_USER' as const,
        firstName: 'Clinic',
        lastName: 'User',
      };

      mockPrismaClient.user.create
        .mockResolvedValueOnce({ ...mockUsers.validMother, ...motherData })
        .mockResolvedValueOnce({ ...mockUsers.validClinicUser, ...clinicData });

      // Act
      const motherResult = await createUser(motherData);
      const clinicResult = await createUser(clinicData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenNthCalledWith(1, {
        data: motherData
      });
      expect(mockPrismaClient.user.create).toHaveBeenNthCalledWith(2, {
        data: clinicData
      });
      expect(motherResult.role).toBe('MOTHER');
      expect(clinicResult.role).toBe('CLINIC_USER');
    });
  });
});