import { AuthService } from '../../../src/services/auth.service';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockUsers } from '../../mocks/data/users.mock';
import { mockCreateUserRequests } from '../../mocks/data/requests.mock';
import * as authRepository from '../../../src/repository/auth.repository';
import * as motherRepository from '../../../src/repository/mother.repository';
import * as jwtUtil from '../../../src/utils/jwt.util';
import bcrypt from 'bcrypt';

// Mock the repositories and utilities
jest.mock('../../../src/repository/auth.repository');
jest.mock('../../../src/repository/mother.repository');
jest.mock('../../../src/utils/jwt.util');

const mockAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;
const mockJwtUtil = jwtUtil as jest.Mocked<typeof jwtUtil>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const request = mockCreateUserRequests.validMotherRequest;
      mockAuthRepository.findUserByEmail.mockResolvedValue(null); // No existing user
      mockAuthRepository.createUser.mockResolvedValue(mockUsers.validMother);
      mockMotherRepository.createMotherProfile.mockResolvedValue({
        id: 'mother-123',
        userId: mockUsers.validMother.id,
        dob: request.dob!,
        nicNumber: request.nicNumber!,
        phone: request.phone || null,
        address: request.address || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await authService.registerUser(request);

      // Assert
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(request.email);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        email: request.email,
        password: `hashed_${request.password}`,
        role: request.role,
        firstName: request.firstName,
        lastName: request.lastName,
      });
      expect(mockMotherRepository.createMotherProfile).toHaveBeenCalledWith({
        userId: mockUsers.validMother.id,
        dob: request.dob,
        nicNumber: request.nicNumber!,
        phone: request.phone || null,
        address: request.address || null,
      });
      expect(result).toEqual({ user: mockUsers.validMother });
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const request = mockCreateUserRequests.duplicateEmailRequest;
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUsers.existingUser);

      // Act & Assert
      await expect(authService.registerUser(request)).rejects.toThrow('Email already in use');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(request.email);
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      // Arrange
      const request = mockCreateUserRequests.validMotherRequest;
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockUsers.validMother);
      mockMotherRepository.createMotherProfile.mockResolvedValue({
        id: 'mother-123',
        userId: mockUsers.validMother.id,
        dob: request.dob!,
        nicNumber: request.nicNumber!,
        phone: request.phone || null,
        address: request.address || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await authService.registerUser(request);

      // Assert
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        email: request.email,
        password: `hashed_${request.password}`,
        role: request.role,
        firstName: request.firstName,
        lastName: request.lastName,
      });
    });

    it('should create mother profile for MOTHER role', async () => {
      // Arrange
      const request = mockCreateUserRequests.validMotherRequest;
      const userWithMotherRole = { ...mockUsers.validMother, role: 'MOTHER' as any };
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(userWithMotherRole);
      mockMotherRepository.createMotherProfile.mockResolvedValue({
        id: 'mother-123',
        userId: userWithMotherRole.id,
        dob: request.dob!,
        nicNumber: request.nicNumber!,
        phone: request.phone || null,
        address: request.address || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await authService.registerUser(request);

      // Assert
      expect(mockMotherRepository.createMotherProfile).toHaveBeenCalledWith({
        userId: userWithMotherRole.id,
        dob: request.dob,
        nicNumber: request.nicNumber!,
        phone: request.phone || null,
        address: request.address || null,
      });
    });

    it('should not create mother profile for CLINIC_USER role', async () => {
      // Arrange
      const request = mockCreateUserRequests.validClinicUserRequest;
      const userWithClinicRole = { ...mockUsers.validClinicUser, role: 'CLINIC_USER' as any };
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(userWithClinicRole);

      // Act
      await authService.registerUser(request);

      // Assert
      expect(mockMotherRepository.createMotherProfile).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const request = mockCreateUserRequests.validMotherRequest;
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authService.registerUser(request)).rejects.toThrow('Database error');
    });
  });

  describe('loginUser', () => {
    it('should validate credentials correctly', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'password123' };
      const user = { ...mockUsers.validMother, password: 'password123' }; // Plain password for comparison
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockJwtUtil.generateToken.mockReturnValue('mock_jwt_token');

      // Act
      const result = await authService.loginUser(loginData);

      // Assert
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(result).toEqual({
        token: 'mock_jwt_token',
        userRole: user.role,
      });
    });

    it('should generate JWT token on success', async () => {
      // Arrange
      const loginData = { email: 'clinic@test.com', password: 'clinicpass123' };
      const user = { ...mockUsers.validClinicUser, password: 'clinicpass123' };
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockJwtUtil.generateToken.mockReturnValue('mock_jwt_token_clinic');

      // Act
      const result = await authService.loginUser(loginData);

      // Assert
      expect(mockJwtUtil.generateToken).toHaveBeenCalledWith({
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
      });
      expect(result.token).toBe('mock_jwt_token_clinic');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'wrongpassword' };
      const user = { ...mockUsers.validMother, password: 'correctpassword' };
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const loginData = { email: 'nonexistent@test.com', password: 'password123' };
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
    });

    it('should handle password comparison correctly', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'password123' };
      const user = { ...mockUsers.validMother, password: 'password123' };
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockJwtUtil.generateToken.mockReturnValue('mock_token');

      // Act
      const result = await authService.loginUser(loginData);

      // Assert
      expect(result).toEqual({
        token: 'mock_token',
        userRole: user.role,
      });
    });

    it('should handle repository errors during login', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'password123' };
      mockAuthRepository.findUserByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(authService.loginUser(loginData)).rejects.toThrow('Database connection failed');
    });
  });
});