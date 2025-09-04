export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  mother: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  medicalRecord: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
  },
  doctorProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
  $connect: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};

// Reset all mocks function
export const resetPrismaMocks = () => {
  Object.values(mockPrismaClient).forEach((table) => {
    if (typeof table === 'object' && table !== null) {
      Object.values(table).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    } else if (typeof table === 'function' && 'mockReset' in table) {
      (table as jest.Mock).mockReset();
    }
  });
};

// Mock the Prisma client module
jest.mock("../../src/prisma/prismaClient", () => ({
  __esModule: true,
  default: mockPrismaClient,
}));