import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../../../src/middleware/auth.middleware';
import { verifyToken } from '../../../src/utils/jwt.util';
import { mockDatabase } from '../../setup/mockDatabase';

// Mock the JWT utility
jest.mock('../../../src/utils/jwt.util');
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };
    
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
    mockDatabase.reset();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decodedUser = {
        email: 'test@example.com',
        role: 'MOTHER',
        firstName: 'Test',
        lastName: 'User',
      };
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      
      mockVerifyToken.mockReturnValue(decodedUser);

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(decodedUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject missing authorization header', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 401,
        message: 'Authorization token missing or malformed',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    it('should reject malformed authorization header', () => {
      // Arrange
      const malformedHeaders = [
        'InvalidToken',
        'Basic dXNlcjpwYXNzd29yZA==',
        'Bearer',
        'bearer valid-token',
        'Bearer ',
      ];

      malformedHeaders.forEach((authorization) => {
        jest.clearAllMocks();
        mockRequest.headers = { authorization };

        // Act
        authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 401,
          message: 'Authorization token missing or malformed',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    it('should reject invalid token', () => {
      // Arrange
      const invalidToken = 'invalid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`,
      };
      
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(invalidToken);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 401,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      // Arrange
      const expiredToken = 'expired-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };
      
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(expiredToken);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 401,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle different token types', () => {
      // Arrange
      const tokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'short-token',
        'very.long.token.with.multiple.dots.and.segments',
      ];

      tokens.forEach((token) => {
        jest.clearAllMocks();
        const decodedUser = { email: 'test@example.com', role: 'CLINIC_USER' };
        mockRequest.headers = { authorization: `Bearer ${token}` };
        mockVerifyToken.mockReturnValue(decodedUser);

        // Act
        authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockVerifyToken).toHaveBeenCalledWith(token);
        expect(mockRequest.user).toEqual(decodedUser);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    it('should handle case-sensitive Bearer prefix', () => {
      // Arrange
      const token = 'valid-token';
      const caseVariations = [
        'bearer valid-token',
        'BEARER valid-token',
        'Bear valid-token',
      ];

      caseVariations.forEach((authorization) => {
        jest.clearAllMocks();
        mockRequest.headers = { authorization };

        // Act
        authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 401,
          message: 'Authorization token missing or malformed',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('requireRole', () => {
    it('should allow access with correct role', () => {
      // Arrange
      const user = {
        email: 'mother@test.com',
        role: 'MOTHER',
        firstName: 'Test',
        lastName: 'Mother',
      };
      mockRequest.user = user;
      const middleware = requireRole(['MOTHER', 'CLINIC_USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access without authentication', () => {
      // Arrange
      mockRequest.user = undefined;
      const middleware = requireRole(['MOTHER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 401,
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access with insufficient role', () => {
      // Arrange
      const user = {
        email: 'mother@test.com',
        role: 'MOTHER',
        firstName: 'Test',
        lastName: 'Mother',
      };
      mockRequest.user = user;
      const middleware = requireRole(['ADMIN', 'SUPER_USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 403,
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access with no role', () => {
      // Arrange
      const user = {
        email: 'noRole@test.com',
        role: undefined as any,
        firstName: 'No',
        lastName: 'Role',
      };
      mockRequest.user = user;
      const middleware = requireRole(['MOTHER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 403,
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access with multiple valid roles', () => {
      // Arrange
      const testCases = [
        { userRole: 'MOTHER', allowedRoles: ['MOTHER', 'CLINIC_USER'] },
        { userRole: 'CLINIC_USER', allowedRoles: ['MOTHER', 'CLINIC_USER'] },
        { userRole: 'ADMIN', allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
      ];

      testCases.forEach(({ userRole, allowedRoles }) => {
        jest.clearAllMocks();
        const user = {
          email: 'test@example.com',
          role: userRole,
          firstName: 'Test',
          lastName: 'User',
        };
        mockRequest.user = user;
        const middleware = requireRole(allowedRoles);

        // Act
        middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
      });
    });

    it('should handle single role requirement', () => {
      // Arrange
      const user = {
        email: 'clinic@test.com',
        role: 'CLINIC_USER',
        firstName: 'Clinic',
        lastName: 'User',
      };
      mockRequest.user = user;
      const middleware = requireRole(['CLINIC_USER']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle empty role array', () => {
      // Arrange
      const user = {
        email: 'test@test.com',
        role: 'MOTHER',
        firstName: 'Test',
        lastName: 'User',
      };
      mockRequest.user = user;
      const middleware = requireRole([]);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 403,
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for roles', () => {
      // Arrange
      const user = {
        email: 'test@test.com',
        role: 'mother', // lowercase
        firstName: 'Test',
        lastName: 'User',
      };
      mockRequest.user = user;
      const middleware = requireRole(['MOTHER']); // uppercase

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 403,
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});