import { MockMedicalRecord } from "../../setup/mockDatabase";

export const mockMedicalRecords: Record<string, MockMedicalRecord> = {
  normalRecord: {
    id: "record-123",
    motherId: "mother-123",
    bloodPressure: 120,
    weight: 65.5,
    height: 165,
    sugarLevel: 95,
    gestationalAge: 20,
    notes: "Normal pregnancy progress",
    recordedAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    risk: "low",
  },
  highRiskRecord: {
    id: "record-456",
    motherId: "mother-456",
    bloodPressure: 150,
    weight: 85.2,
    height: 160,
    sugarLevel: 140,
    gestationalAge: 30,
    notes: "Gestational hypertension - high risk",
    recordedAt: new Date("2024-01-02T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
    risk: "high",
  },
  recentRecord: {
    id: "record-789",
    motherId: "mother-789",
    bloodPressure: 110,
    weight: 72.0,
    height: 170,
    sugarLevel: 90,
    gestationalAge: 12,
    notes: "Early pregnancy - normal",
    recordedAt: new Date("2024-02-01T00:00:00Z"),
    updatedAt: new Date("2024-02-01T00:00:00Z"),
    risk: "low",
  },
  incompleteRecord: {
    id: "record-999",
    motherId: "mother-123",
    bloodPressure: null,
    weight: 68.0,
    height: null,
    sugarLevel: null,
    gestationalAge: null,
    notes: null,
    recordedAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
    risk: "low",
  },
};

export const createMockMedicalRecord = (
  overrides: Partial<MockMedicalRecord> = {}
): MockMedicalRecord => ({
  ...mockMedicalRecords.normalRecord,
  ...overrides,
});

export const generateMockMedicalRecord = (
  motherId: string,
  id?: string
): MockMedicalRecord => ({
  id: id || `record-${Date.now()}`,
  motherId,
  bloodPressure: 120,
  weight: 65.0,
  height: 165,
  sugarLevel: 95,
  gestationalAge: 20,
  notes: "Regular checkup",
  recordedAt: new Date(),
  updatedAt: new Date(),
  risk: "low",
});