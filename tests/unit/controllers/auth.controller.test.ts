import { Request, Response } from 'express';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockUsers } from '../../mocks/data/users.mock';
import { mockCreateUserRequests, mockLoginRequests } from '../../mocks/data/requests.mock';

// Mock the AuthService at the module level
const mockAuthService = {
  registerUser: jest.fn(),
  loginUser: jest.fn(),
};

jest.mock('../../../src/services/auth.service', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => mockAuthService)
  };
});

// Import the controller after mocking
const { register, login } = require('../../../src/controllers/auth.controller');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
      params: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Clear all mocks
    jest.clearAllMocks();
    mockDatabase.reset();
    mockAuthService.registerUser.mockReset();
    mockAuthService.loginUser.mockReset();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerRequest = mockCreateUserRequests.validMotherRequest;
      mockRequest.body = registerRequest;
      
      const expectedUser = { user: mockUsers.validMother };
      mockAuthService.registerUser = jest.fn().mockResolvedValue(expectedUser);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(registerRequest);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 201,
        message: 'User registered successfully',
        data: expectedUser,
      });
    });

    it('should return 400 for duplicate email', async () => {
      // Arrange
      const duplicateRequest = mockCreateUserRequests.duplicateEmailRequest;
      mockRequest.body = duplicateRequest;
      
      const error = new Error('Email already in use');
      mockAuthService.registerUser = jest.fn().mockRejectedValue(error);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(duplicateRequest);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Email already in use',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidRequest = mockCreateUserRequests.invalidRequest;
      mockRequest.body = invalidRequest;
      
      const error = new Error('Invalid input data');
      mockAuthService.registerUser = jest.fn().mockRejectedValue(error);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Invalid input data',
      });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const validRequest = mockCreateUserRequests.validMotherRequest;
      mockRequest.body = validRequest;
      
      const error = new Error();
      mockAuthService.registerUser = jest.fn().mockRejectedValue(error);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Registration failed',
      });
    });

    it('should create mother profile for MOTHER role', async () => {
      // Arrange
      const motherRequest = mockCreateUserRequests.validMotherRequest;
      mockRequest.body = motherRequest;
      
      const expectedResult = { user: { ...mockUsers.validMother, role: 'MOTHER' } };
      mockAuthService.registerUser = jest.fn().mockResolvedValue(expectedResult);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(motherRequest);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 201,
        message: 'User registered successfully',
        data: expectedResult,
      });
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const loginRequest = mockLoginRequests.validMotherLogin;
      mockRequest.body = loginRequest;
      
      const expectedResult = { 
        token: 'mock_jwt_token', 
        userRole: 'MOTHER' 
      };
      mockAuthService.loginUser = jest.fn().mockResolvedValue(expectedResult);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.loginUser).toHaveBeenCalledWith({
        email: loginRequest.username,
        password: loginRequest.password,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Login successful',
        data: expectedResult,
      });
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const invalidLogin = mockLoginRequests.invalidPasswordLogin;
      mockRequest.body = invalidLogin;
      
      const error = new Error('Invalid email or password');
      mockAuthService.loginUser = jest.fn().mockRejectedValue(error);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.loginUser).toHaveBeenCalledWith({
        email: invalidLogin.username,
        password: invalidLogin.password,
      });
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Invalid email or password',
      });
    });

    it('should handle missing user scenarios', async () => {
      // Arrange
      const invalidEmailLogin = mockLoginRequests.invalidEmailLogin;
      mockRequest.body = invalidEmailLogin;
      
      const error = new Error('Invalid email or password');
      mockAuthService.loginUser = jest.fn().mockRejectedValue(error);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Invalid email or password',
      });
    });

    it('should return JWT token on success', async () => {
      // Arrange
      const validLogin = mockLoginRequests.validClinicLogin;
      mockRequest.body = validLogin;
      
      const expectedResult = { 
        token: 'mock_jwt_token_clinic_user', 
        userRole: 'CLINIC_USER' 
      };
      mockAuthService.loginUser = jest.fn().mockResolvedValue(expectedResult);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.loginUser).toHaveBeenCalledWith({
        email: validLogin.username,
        password: validLogin.password,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Login successful',
        data: expectedResult,
      });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const validLogin = mockLoginRequests.validMotherLogin;
      mockRequest.body = validLogin;
      
      const error = new Error();
      mockAuthService.loginUser = jest.fn().mockRejectedValue(error);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Login failed',
      });
    });
  });
});