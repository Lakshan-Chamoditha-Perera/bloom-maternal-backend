import { CreateUserRequest } from "../../../src/types/payloads/requests/createUserRequest";
import { Role } from "../../../src/types/dtos/types";

export const mockCreateUserRequests: Record<string, CreateUserRequest> = {
  validMotherRequest: {
    email: "newmother@test.com",
    password: "password123",
    role: Role.MOTHER,
    firstName: "New",
    lastName: "Mother",
    dob: new Date("1992-03-15"),
    nicNumber: "920123456V",
    phone: "+94773456789",
    address: "789 Third St, Galle",
  },
  validClinicUserRequest: {
    email: "newclinic@test.com",
    password: "clinicpass123",
    role: Role.CLINIC_USER,
    firstName: "New",
    lastName: "Clinic",
    licenseNumber: "LIC123456",
    clinic_code: "CLINIC001",
  },
  invalidRequest: {
    email: "invalid-email",
    password: "123", // Too short
    role: Role.MOTHER,
  },
  duplicateEmailRequest: {
    email: "existing@test.com",
    password: "password123",
    role: Role.MOTHER,
    firstName: "Duplicate",
    lastName: "Email",
  },
  missingFieldsRequest: {
    email: "incomplete@test.com",
    password: "password123",
    role: Role.MOTHER,
    // Missing required fields for mother
  },
};

export const mockLoginRequests = {
  validMotherLogin: {
    username: "mother@test.com",
    password: "password123",
  },
  validClinicLogin: {
    username: "clinic@test.com",
    password: "clinicpass123",
  },
  invalidEmailLogin: {
    username: "nonexistent@test.com",
    password: "password123",
  },
  invalidPasswordLogin: {
    username: "mother@test.com",
    password: "wrongpassword",
  },
  missingFieldsLogin: {
    username: "mother@test.com",
    // Missing password
  },
};

export const createMockCreateUserRequest = (
  overrides: Partial<CreateUserRequest> = {}
): CreateUserRequest => ({
  ...mockCreateUserRequests.validMotherRequest,
  ...overrides,
});