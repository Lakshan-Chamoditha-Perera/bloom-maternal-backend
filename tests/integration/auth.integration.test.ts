import { AuthService } from '../../src/services/auth.service';
import { MotherService } from '../../src/services/mother.service';
import { Role } from '../../src/types/dtos/types';
import { mockDatabase } from '../setup/mockDatabase';
import { mockUsers } from '../mocks/data/users.mock';
import { mockMothers } from '../mocks/data/mothers.mock';
import { mockCreateUserRequests } from '../mocks/data/requests.mock';
import * as authRepository from '../../src/repository/auth.repository';
import * as motherRepository from '../../src/repository/mother.repository';
import * as jwtUtil from '../../src/utils/jwt.util';
import * as bcrypt from 'bcrypt';

// Mock the repositories and utilities
jest.mock('../../src/repository/auth.repository');
jest.mock('../../src/repository/mother.repository');
jest.mock('../../src/utils/jwt.util');
jest.mock('bcrypt');

const mockAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockMotherRepository = motherRepository as jest.Mocked<typeof motherRepository>;
const mockJwtUtil = jwtUtil as jest.Mocked<typeof jwtUtil>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Integration Tests', () => {
  let authService: AuthService;
  let motherService: MotherService;

  beforeEach(() => {
    authService = new AuthService();
    motherService = new MotherService();
    jest.clearAllMocks();
    mockDatabase.reset();
    
    // Setup bcrypt mock
    mockBcrypt.hash.mockImplementation(async (password: string | Buffer, saltOrRounds: string | number) => `hashed_${password}`);
  });

  describe('User Registration and Profile Creation Flow', () => {
    it('should complete full mother registration workflow', async () => {
      // Arrange
      const registrationRequest = mockCreateUserRequests.validMotherRequest;
      const createdUser = { ...mockUsers.validMother, role: Role.MOTHER };
      const createdMotherProfile = mockMothers.validMother1;

      // Mock repository calls
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(createdUser);
      mockMotherRepository.createMotherProfile.mockResolvedValue(createdMotherProfile);
      mockMotherRepository.getMotherProfileByUserId.mockResolvedValue(createdMotherProfile);

      // Act - Step 1: Register user
      const registrationResult = await authService.registerUser(registrationRequest);

      // Assert - User creation
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(registrationRequest.email);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        email: registrationRequest.email,
        password: `hashed_${registrationRequest.password}`,
        role: registrationRequest.role,
        firstName: registrationRequest.firstName,
        lastName: registrationRequest.lastName,
      });
      expect(mockMotherRepository.createMotherProfile).toHaveBeenCalledWith({
        userId: createdUser.id,
        dob: registrationRequest.dob,
        nicNumber: registrationRequest.nicNumber,
        phone: registrationRequest.phone,
        address: registrationRequest.address,
      });
      expect(registrationResult).toEqual({ user: createdUser });

      // Act - Step 2: Retrieve mother profile
      const motherProfile = await motherService.getMotherByUserId(createdUser.id);

      // Assert - Profile retrieval
      expect(mockMotherRepository.getMotherProfileByUserId).toHaveBeenCalledWith(createdUser.id);
      expect(motherProfile).toEqual(createdMotherProfile);
    });

    it('should complete full clinic user registration workflow', async () => {
      // Arrange
      const registrationRequest = mockCreateUserRequests.validClinicUserRequest;
      const createdUser = { ...mockUsers.validClinicUser, role: Role.CLINIC_USER };

      // Mock repository calls
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(createdUser);

      // Act - Register clinic user
      const registrationResult = await authService.registerUser(registrationRequest);

      // Assert - User creation (no mother profile for clinic users)
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(registrationRequest.email);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        email: registrationRequest.email,
        password: `hashed_${registrationRequest.password}`,
        role: registrationRequest.role,
        firstName: registrationRequest.firstName,
        lastName: registrationRequest.lastName,
      });
      expect(mockMotherRepository.createMotherProfile).not.toHaveBeenCalled();
      expect(registrationResult).toEqual({ user: createdUser });
    });

    it('should handle registration failure rollback', async () => {
      // Arrange
      const registrationRequest = mockCreateUserRequests.validMotherRequest;
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockUsers.validMother);
      mockMotherRepository.createMotherProfile.mockRejectedValue(new Error('Profile creation failed'));

      // Act & Assert
      await expect(authService.registerUser(registrationRequest)).rejects.toThrow('Profile creation failed');
      
      // Verify user was created but profile creation failed
      expect(mockAuthRepository.createUser).toHaveBeenCalled();
      expect(mockMotherRepository.createMotherProfile).toHaveBeenCalled();
    });
  });

  describe('Login and Authentication Flow', () => {
    it('should complete full login workflow', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'password123' };
      const user = { ...mockUsers.validMother, password: 'password123' };
      const token = 'mock_jwt_token';

      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockJwtUtil.generateToken.mockReturnValue(token);

      // Act - Login
      const loginResult = await authService.loginUser(loginData);

      // Assert
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockJwtUtil.generateToken).toHaveBeenCalledWith({
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
      });
      expect(loginResult).toEqual({
        token,
        userRole: user.role,
      });
    });

    it('should handle login with invalid credentials', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'wrongpassword' };
      const user = { ...mockUsers.validMother, password: 'correctpassword' };

      mockAuthRepository.findUserByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockJwtUtil.generateToken).not.toHaveBeenCalled();
    });

    it('should handle login with non-existent user', async () => {
      // Arrange
      const loginData = { email: 'nonexistent@test.com', password: 'password123' };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockJwtUtil.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('User Registration Edge Cases', () => {
    it('should prevent duplicate email registration', async () => {
      // Arrange
      const registrationRequest = mockCreateUserRequests.duplicateEmailRequest;
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUsers.existingUser);

      // Act & Assert
      await expect(authService.registerUser(registrationRequest)).rejects.toThrow('Email already in use');
      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(registrationRequest.email);
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
      expect(mockMotherRepository.createMotherProfile).not.toHaveBeenCalled();
    });

    it('should handle partial registration data', async () => {
      // Arrange
      const partialRequest = {
        email: 'partial@test.com',
        password: 'password123',
        role: Role.MOTHER,
        firstName: 'Partial',
        // Missing lastName, dob, etc.
      };
      const createdUser = { ...mockUsers.validMother, email: partialRequest.email };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(createdUser);
      mockMotherRepository.createMotherProfile.mockResolvedValue(mockMothers.validMother1);

      // Act
      const result = await authService.registerUser(partialRequest);

      // Assert
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith({
        email: partialRequest.email,
        password: `hashed_${partialRequest.password}`,
        role: partialRequest.role,
        firstName: partialRequest.firstName,
        lastName: undefined,
      });
      expect(mockMotherRepository.createMotherProfile).toHaveBeenCalledWith({
        userId: createdUser.id,
        dob: expect.any(Date), // Service provides default Date
        nicNumber: undefined,
        phone: null, // Service defaults to null
        address: null, // Service defaults to null
      });
      expect(result).toEqual({ user: createdUser });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous registrations', async () => {
      // Arrange
      const requests = [
        { ...mockCreateUserRequests.validMotherRequest, email: 'mother1@test.com' },
        { ...mockCreateUserRequests.validMotherRequest, email: 'mother2@test.com' },
        { ...mockCreateUserRequests.validClinicUserRequest, email: 'clinic1@test.com' },
      ];

      const users = [
        { ...mockUsers.validMother, id: 'user-1', email: 'mother1@test.com' },
        { ...mockUsers.validMother, id: 'user-2', email: 'mother2@test.com' },
        { ...mockUsers.validClinicUser, id: 'user-3', email: 'clinic1@test.com' },
      ];

      // Mock repository responses
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser
        .mockResolvedValueOnce(users[0])
        .mockResolvedValueOnce(users[1])
        .mockResolvedValueOnce(users[2]);
      mockMotherRepository.createMotherProfile
        .mockResolvedValueOnce({ ...mockMothers.validMother1, userId: 'user-1' })
        .mockResolvedValueOnce({ ...mockMothers.validMother2, userId: 'user-2' });

      // Act - Simulate concurrent registrations
      const results = await Promise.all(
        requests.map(request => authService.registerUser(request))
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(mockAuthRepository.createUser).toHaveBeenCalledTimes(3);
      expect(mockMotherRepository.createMotherProfile).toHaveBeenCalledTimes(2); // Only mothers
      
      // Verify each result
      results.forEach((result, index) => {
        expect(result.user).toEqual(users[index]);
      });
    });
  });

  describe('Error Propagation', () => {
    it('should propagate repository errors correctly', async () => {
      // Arrange
      const registrationRequest = mockCreateUserRequests.validMotherRequest;
      mockAuthRepository.findUserByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(authService.registerUser(registrationRequest)).rejects.toThrow('Database connection failed');
    });

    it('should handle JWT generation errors', async () => {
      // Arrange
      const loginData = { email: 'mother@test.com', password: 'password123' };
      const user = { ...mockUsers.validMother, password: 'password123' };

      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockJwtUtil.generateToken.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      // Act & Assert
      await expect(authService.loginUser(loginData)).rejects.toThrow('JWT generation failed');
    });
  });
});