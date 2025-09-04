import { Role } from "../../../src/types/dtos/types";
import { MockUser } from "../../setup/mockDatabase";

export const mockUsers: Record<string, MockUser> = {
  validMother: {
    id: "user-123",
    email: "mother@test.com",
    password: "hashed_password123",
    role: Role.MOTHER,
    firstName: "Jane",
    lastName: "Doe",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  validClinicUser: {
    id: "user-456",
    email: "clinic@test.com",
    password: "hashed_clinicpass123",
    role: Role.CLINIC_USER,
    firstName: "Dr. John",
    lastName: "Smith",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  existingUser: {
    id: "user-789",
    email: "existing@test.com",
    password: "hashed_existing123",
    role: Role.MOTHER,
    firstName: "Existing",
    lastName: "User",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
};

export const createMockUser = (
  overrides: Partial<MockUser> = {}
): MockUser => ({
  ...mockUsers.validMother,
  ...overrides,
});

export const generateMockUser = (
  email: string,
  role: Role = Role.MOTHER,
  id?: string
): MockUser => ({
  id: id || `user-${Date.now()}`,
  email,
  password: `hashed_${email}`,
  role,
  firstName: "Test",
  lastName: "User",
  createdAt: new Date(),
  updatedAt: new Date(),
});