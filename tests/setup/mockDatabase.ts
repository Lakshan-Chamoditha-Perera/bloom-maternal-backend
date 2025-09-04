import { Role } from "../../src/types/dtos/types";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMotherProfile {
  id: string;
  userId: string;
  dob: Date;
  nicNumber: string;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMedicalRecord {
  id: string;
  motherId: string;
  bloodPressure: number | null;
  weight: number | null;
  height: number | null;
  sugarLevel: number | null;
  gestationalAge: number | null;
  notes: string | null;
  recordedAt: Date;
  updatedAt: Date;
  risk: string;
}

export interface MockDoctorProfile {
  id: string;
  userId: string;
  licenseNumber?: string;
  clinic_code?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MockDatabase {
  private users: Map<string, MockUser> = new Map();
  private mothers: Map<string, MockMotherProfile> = new Map();
  private medicalRecords: Map<string, MockMedicalRecord> = new Map();
  private doctors: Map<string, MockDoctorProfile> = new Map();
  private userIdCounter = 1;
  private motherIdCounter = 1;
  private recordIdCounter = 1;
  private doctorIdCounter = 1;

  // User operations
  createUser(data: Omit<MockUser, "id" | "createdAt" | "updatedAt">): MockUser {
    const id = `user-${this.userIdCounter++}`;
    const user: MockUser = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  findUserByEmail(email: string): MockUser | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  findUserById(id: string): MockUser | null {
    return this.users.get(id) || null;
  }

  updateUser(id: string, data: Partial<MockUser>): MockUser | null {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // Mother operations
  createMotherProfile(
    data: Omit<MockMotherProfile, "id" | "createdAt" | "updatedAt">
  ): MockMotherProfile {
    const id = `mother-${this.motherIdCounter++}`;
    const mother: MockMotherProfile = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mothers.set(id, mother);
    return mother;
  }

  findMotherByUserId(userId: string): MockMotherProfile | null {
    for (const mother of this.mothers.values()) {
      if (mother.userId === userId) {
        return mother;
      }
    }
    return null;
  }

  findMotherByNic(nicNumber: string): MockMotherProfile | null {
    for (const mother of this.mothers.values()) {
      if (mother.nicNumber === nicNumber) {
        return mother;
      }
    }
    return null;
  }

  findMotherById(id: string): MockMotherProfile | null {
    return this.mothers.get(id) || null;
  }

  updateMotherProfile(
    id: string,
    data: Partial<MockMotherProfile>
  ): MockMotherProfile | null {
    const mother = this.mothers.get(id);
    if (!mother) return null;

    const updated = { ...mother, ...data, updatedAt: new Date() };
    this.mothers.set(id, updated);
    return updated;
  }

  getAllMothers(): MockMotherProfile[] {
    return Array.from(this.mothers.values());
  }

  deleteMotherProfile(id: string): boolean {
    return this.mothers.delete(id);
  }

  // Medical record operations
  createMedicalRecord(
    data: Omit<MockMedicalRecord, "id" | "recordedAt" | "updatedAt">
  ): MockMedicalRecord {
    const id = `record-${this.recordIdCounter++}`;
    const record: MockMedicalRecord = {
      ...data,
      id,
      recordedAt: new Date(),
      updatedAt: new Date(),
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  findMedicalRecordsByMotherId(motherId: string): MockMedicalRecord[] {
    return Array.from(this.medicalRecords.values()).filter(
      (record) => record.motherId === motherId
    );
  }

  findMedicalRecordById(id: string): MockMedicalRecord | null {
    return this.medicalRecords.get(id) || null;
  }

  updateMedicalRecord(
    id: string,
    data: Partial<MockMedicalRecord>
  ): MockMedicalRecord | null {
    const record = this.medicalRecords.get(id);
    if (!record) return null;

    const updated = { ...record, ...data, updatedAt: new Date() };
    this.medicalRecords.set(id, updated);
    return updated;
  }

  deleteMedicalRecord(id: string): boolean {
    return this.medicalRecords.delete(id);
  }

  // Doctor operations
  createDoctorProfile(
    data: Omit<MockDoctorProfile, "id" | "createdAt" | "updatedAt">
  ): MockDoctorProfile {
    const id = `doctor-${this.doctorIdCounter++}`;
    const doctor: MockDoctorProfile = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  findDoctorByUserId(userId: string): MockDoctorProfile | null {
    for (const doctor of this.doctors.values()) {
      if (doctor.userId === userId) {
        return doctor;
      }
    }
    return null;
  }

  findDoctorById(id: string): MockDoctorProfile | null {
    return this.doctors.get(id) || null;
  }

  // Reset for test isolation
  reset() {
    this.users.clear();
    this.mothers.clear();
    this.medicalRecords.clear();
    this.doctors.clear();
    this.userIdCounter = 1;
    this.motherIdCounter = 1;
    this.recordIdCounter = 1;
    this.doctorIdCounter = 1;
  }

  // Utility methods for testing
  getUsers(): MockUser[] {
    return Array.from(this.users.values());
  }

  getMothers(): MockMotherProfile[] {
    return Array.from(this.mothers.values());
  }

  getMedicalRecords(): MockMedicalRecord[] {
    return Array.from(this.medicalRecords.values());
  }

  getDoctors(): MockDoctorProfile[] {
    return Array.from(this.doctors.values());
  }

  // Statistics for testing
  getUserCount(): number {
    return this.users.size;
  }

  getMotherCount(): number {
    return this.mothers.size;
  }

  getMedicalRecordCount(): number {
    return this.medicalRecords.size;
  }

  getDoctorCount(): number {
    return this.doctors.size;
  }
}

// Global instance for tests
export const mockDatabase = new MockDatabase();