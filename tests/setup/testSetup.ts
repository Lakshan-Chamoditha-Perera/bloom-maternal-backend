import { mockDatabase, MockDatabase } from './mockDatabase';
import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma.mock';

// Global test setup
declare global {
  var mockDatabase: MockDatabase;
}

global.mockDatabase = mockDatabase;

// Mock Prisma client globally
jest.mock('../../src/prisma/prismaClient', () => ({
  __esModule: true,
  default: mockPrismaClient,
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload: any) => `mock_jwt_token_${JSON.stringify(payload)}`),
  verify: jest.fn((token: string) => {
    if (token.startsWith('mock_jwt_token_')) {
      return JSON.parse(token.replace('mock_jwt_token_', ''));
    }
    throw new Error('Invalid token');
  }),
}));

// Mock axios for external API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn().mockResolvedValue({ data: { prediction: 'low_risk' } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
  })),
  post: jest.fn().mockResolvedValue({ data: { prediction: 'low_risk' } }),
  get: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.PREDICTOR_API_URL = 'http://localhost:8000';

// Global test hooks
beforeEach(() => {
  // Reset the mock database before each test
  mockDatabase.reset();
  
  // Reset all Prisma mocks
  resetPrismaMocks();
  
  // Clear all Jest mocks
  jest.clearAllMocks();
});

afterEach(() => {
  // Additional cleanup if needed
});

// Global test teardown
afterAll(async () => {
  await mockDatabase.reset();
});