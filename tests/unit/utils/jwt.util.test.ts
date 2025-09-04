import { generateToken, verifyToken } from '../../../src/utils/jwt.util';
import jwt from 'jsonwebtoken';

// Don't mock jwt for these tests since we want to test the actual JWT functionality
// But we'll control the environment variable
const originalJwtSecret = process.env.JWT_SECRET;

describe('JwtUtil', () => {
  beforeEach(() => {
    // Set a consistent test secret
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
  });

  afterAll(() => {
    // Restore original JWT_SECRET
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      // Arrange
      const payload = {
        email: 'test@example.com',
        role: 'MOTHER',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      // Act
      const token = generateToken(payload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should generate different tokens for different payloads', () => {
      // Arrange
      const payload1 = {
        email: 'user1@example.com',
        role: 'MOTHER',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      
      const payload2 = {
        email: 'user2@example.com',
        role: 'CLINIC_USER',
        firstName: 'John',
        lastName: 'Smith',
      };

      // Act
      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      // Assert
      expect(token1).not.toBe(token2);
    });

    it('should generate token with minimal required fields', () => {
      // Arrange
      const payload = {
        email: 'minimal@example.com',
        role: 'CLINIC_USER',
      };

      // Act
      const token = generateToken(payload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token contains the payload
      const decoded = jwt.verify(token, 'test-secret-key-for-unit-tests') as any;
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.firstName).toBeUndefined();
      expect(decoded.lastName).toBeUndefined();
    });

    it('should generate token with optional fields', () => {
      // Arrange
      const payload = {
        email: 'complete@example.com',
        role: 'MOTHER',
        firstName: 'Complete',
        lastName: 'User',
      };

      // Act
      const token = generateToken(payload);

      // Assert
      const decoded = jwt.verify(token, 'test-secret-key-for-unit-tests') as any;
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.firstName).toBe(payload.firstName);
      expect(decoded.lastName).toBe(payload.lastName);
    });

    it('should include expiration time', () => {
      // Arrange
      const payload = {
        email: 'expire@example.com',
        role: 'MOTHER',
      };

      // Act
      const token = generateToken(payload);

      // Assert
      const decoded = jwt.verify(token, 'test-secret-key-for-unit-tests') as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      // Should expire in 1 day (86400 seconds)
      const expectedExpiration = decoded.iat + 86400;
      expect(decoded.exp).toBe(expectedExpiration);
    });

    it('should handle special characters in payload', () => {
      // Arrange
      const payload = {
        email: 'special+chars@example.com',
        role: 'MOTHER',
        firstName: 'María José',
        lastName: "O'Connor-Smith",
      };

      // Act
      const token = generateToken(payload);

      // Assert
      const decoded = jwt.verify(token, 'test-secret-key-for-unit-tests') as any;
      expect(decoded.email).toBe(payload.email);
      expect(decoded.firstName).toBe(payload.firstName);
      expect(decoded.lastName).toBe(payload.lastName);
    });

    it('should use default secret when JWT_SECRET not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      const payload = {
        email: 'default@example.com',
        role: 'MOTHER',
      };

      // Act
      const token = generateToken(payload);

      // Assert
      expect(token).toBeDefined();
      
      // Should be verifiable with default secret
      const decoded = jwt.verify(token, 'default_secret') as any;
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      // Arrange
      const payload = {
        email: 'verify@example.com',
        role: 'CLINIC_USER',
        firstName: 'Verify',
        lastName: 'Test',
      };
      const token = generateToken(payload);

      // Act
      const decoded = verifyToken(token);

      // Assert
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.firstName).toBe(payload.firstName);
      expect(decoded.lastName).toBe(payload.lastName);
    });

    it('should throw error for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act & Assert
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for malformed token', () => {
      // Arrange
      const malformedTokens = [
        'not-a-jwt-token',
        'missing.dots',
        'too.many.dots.in.token.here',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Missing parts
      ];

      malformedTokens.forEach((token) => {
        // Act & Assert
        expect(() => verifyToken(token)).toThrow();
      });
    });

    it('should throw error for token with wrong secret', () => {
      // Arrange
      const payload = { email: 'wrong@example.com', role: 'MOTHER' };
      const tokenWithWrongSecret = jwt.sign(payload, 'wrong-secret', { expiresIn: '1d' });

      // Act & Assert
      expect(() => verifyToken(tokenWithWrongSecret)).toThrow();
    });

    it('should throw error for expired token', () => {
      // Arrange
      const payload = { email: 'expired@example.com', role: 'MOTHER' };
      const expiredToken = jwt.sign(payload, 'test-secret-key-for-unit-tests', { expiresIn: '-1s' }); // Already expired

      // Act & Assert
      expect(() => verifyToken(expiredToken)).toThrow();
    });

    it('should handle token without optional fields', () => {
      // Arrange
      const payload = {
        email: 'minimal@example.com',
        role: 'CLINIC_USER',
      };
      const token = generateToken(payload);

      // Act
      const decoded = verifyToken(token);

      // Assert
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.firstName).toBeUndefined();
      expect(decoded.lastName).toBeUndefined();
    });

    it('should preserve all payload fields', () => {
      // Arrange
      const payload = {
        email: 'complete@example.com',
        role: 'MOTHER',
        firstName: 'Complete',
        lastName: 'User',
      };
      const token = generateToken(payload);

      // Act
      const decoded = verifyToken(token);

      // Assert
      expect(decoded).toMatchObject(payload);
      // Should also have JWT standard claims
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should handle roundtrip generation and verification', () => {
      // Arrange
      const testCases = [
        {
          email: 'test1@example.com',
          role: 'MOTHER',
          firstName: 'Test1',
          lastName: 'User1',
        },
        {
          email: 'test2@example.com',
          role: 'CLINIC_USER',
        },
        {
          email: 'test3@example.com',
          role: 'ADMIN',
          firstName: 'Admin',
        },
      ];

      testCases.forEach((payload) => {
        // Act
        const token = generateToken(payload);
        const decoded = verifyToken(token);

        // Assert
        expect(decoded.email).toBe(payload.email);
        expect(decoded.role).toBe(payload.role);
        expect(decoded.firstName).toBe(payload.firstName);
        expect(decoded.lastName).toBe(payload.lastName);
      });
    });

    it('should use default secret when JWT_SECRET not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      const payload = { email: 'default@example.com', role: 'MOTHER' };
      const token = jwt.sign(payload, 'default_secret', { expiresIn: '1d' });

      // Act
      const decoded = verifyToken(token);

      // Assert
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });
});