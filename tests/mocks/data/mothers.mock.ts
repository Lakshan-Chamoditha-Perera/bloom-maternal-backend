import { MockMotherProfile } from "../../setup/mockDatabase";

export const mockMothers: Record<string, MockMotherProfile> = {
  validMother1: {
    id: "mother-123",
    userId: "user-123",
    dob: new Date("1992-03-15"),
    nicNumber: "920123456V",
    phone: "+94773456789",
    address: "123 Main St, Colombo",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  validMother2: {
    id: "mother-456",
    userId: "user-456",
    dob: new Date("1988-07-20"),
    nicNumber: "880720123V",
    phone: "+94712345678",
    address: "456 Second St, Kandy",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  pregnantMother: {
    id: "mother-789",
    userId: "user-789",
    dob: new Date("1995-11-10"),
    nicNumber: "951110789V",
    phone: "+94765432109",
    address: "789 Third St, Galle",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
};

export const createMockMother = (
  overrides: Partial<MockMotherProfile> = {}
): MockMotherProfile => ({
  ...mockMothers.validMother1,
  ...overrides,
});

export const generateMockMother = (
  userId: string,
  id?: string
): MockMotherProfile => ({
  id: id || `mother-${Date.now()}`,
  userId,
  dob: new Date("1990-01-01"),
  nicNumber: "900101234V",
  phone: "+94771234567",
  address: "Test Address",
  createdAt: new Date(),
  updatedAt: new Date(),
});