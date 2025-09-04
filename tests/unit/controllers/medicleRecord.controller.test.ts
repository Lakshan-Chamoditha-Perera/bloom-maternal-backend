import { Request, Response } from 'express';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMedicalRecords } from '../../mocks/data/medicalRecords.mock';

// Mock the MedicleRecordService at the module level
const mockMedicleRecordService = {
  getMedicalRecordsByMotherId: jest.fn(),
  updateMedicalRecord: jest.fn(),
  deleteMedicalRecord: jest.fn(),
  getAllMedicleRecordsWithMother: jest.fn(),
  createMedicalRecordAndPredict: jest.fn(),
};

jest.mock('../../../src/services/medicleRecord.service', () => {
  return {
    MedicleRecordService: jest.fn().mockImplementation(() => mockMedicleRecordService)
  };
});

// Import the controller after mocking
const {
  getMedicalRecordsByMotherIdController,
  updateMedicalRecordController,
  deleteMedicalRecordController,
  getAllMedicleRecordsWithMotherController,
  createMedicalRecordAndPredictController,
} = require('../../../src/controllers/medicleRecord.controller');

describe('MedicleRecordController', () => {
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
      user: { id: 'user-123', email: 'test@example.com', role: 'CLINIC_USER' },
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
    mockDatabase.reset();
    Object.values(mockMedicleRecordService).forEach((mockFn: any) => {
      if (typeof mockFn.mockReset === 'function') {
        mockFn.mockReset();
      }
    });
  });

  describe('getMedicalRecordsByMotherIdController', () => {
    it('should fetch medical records by mother ID successfully', async () => {
      // Arrange
      const motherId = 'mother-123';
      mockRequest.params = { motherId };
      const expectedRecords = [mockMedicalRecords.normalRecord, mockMedicalRecords.incompleteRecord];
      mockMedicleRecordService.getMedicalRecordsByMotherId = jest.fn().mockResolvedValue(expectedRecords);

      // Act
      await getMedicalRecordsByMotherIdController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.getMedicalRecordsByMotherId).toHaveBeenCalledWith(motherId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Medical records fetched successfully',
        data: expectedRecords,
      });
    });

    it('should handle empty medical records list', async () => {
      // Arrange
      const motherId = 'mother-with-no-records';
      mockRequest.params = { motherId };
      const emptyRecords: any[] = [];
      mockMedicleRecordService.getMedicalRecordsByMotherId = jest.fn().mockResolvedValue(emptyRecords);

      // Act
      await getMedicalRecordsByMotherIdController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.getMedicalRecordsByMotherId).toHaveBeenCalledWith(motherId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Medical records fetched successfully',
        data: emptyRecords,
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const motherId = 'invalid-mother-id';
      mockRequest.params = { motherId };
      const error = new Error('Mother not found');
      mockMedicleRecordService.getMedicalRecordsByMotherId = jest.fn().mockRejectedValue(error);

      // Act
      await getMedicalRecordsByMotherIdController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Mother not found',
      });
    });
  });

  describe('updateMedicalRecordController', () => {
    it('should update medical record successfully', async () => {
      // Arrange
      const recordId = 'record-123';
      const updateData = { weight: 70, bloodPressure: 125 };
      mockRequest.params = { id: recordId };
      mockRequest.body = updateData;
      
      const updatedRecord = { ...mockMedicalRecords.normalRecord, ...updateData };
      mockMedicleRecordService.updateMedicalRecord = jest.fn().mockResolvedValue(updatedRecord);

      // Act
      await updateMedicalRecordController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.updateMedicalRecord).toHaveBeenCalledWith(recordId, updateData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Medical record updated successfully',
        data: updatedRecord,
      });
    });

    it('should handle non-existent record', async () => {
      // Arrange
      const recordId = 'non-existent-record';
      const updateData = { weight: 70 };
      mockRequest.params = { id: recordId };
      mockRequest.body = updateData;
      
      const error = new Error('Medical record not found');
      mockMedicleRecordService.updateMedicalRecord = jest.fn().mockRejectedValue(error);

      // Act
      await updateMedicalRecordController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Medical record not found',
      });
    });
  });

  describe('deleteMedicalRecordController', () => {
    it('should delete medical record successfully', async () => {
      // Arrange
      const recordId = 'record-123';
      mockRequest.params = { id: recordId };
      mockMedicleRecordService.deleteMedicalRecord = jest.fn().mockResolvedValue(undefined);

      // Act
      await deleteMedicalRecordController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.deleteMedicalRecord).toHaveBeenCalledWith(recordId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Medical record deleted successfully',
        data: null,
      });
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const recordId = 'non-existent-record';
      mockRequest.params = { id: recordId };
      const error = new Error('Medical record not found');
      mockMedicleRecordService.deleteMedicalRecord = jest.fn().mockRejectedValue(error);

      // Act
      await deleteMedicalRecordController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Medical record not found',
      });
    });
  });

  describe('getAllMedicleRecordsWithMotherController', () => {
    it('should fetch all medical records with mother data', async () => {
      // Arrange
      const mockRecordsWithMothers = [
        { ...mockMedicalRecords.normalRecord, mother: { name: 'Jane Doe' } },
        { ...mockMedicalRecords.highRiskRecord, mother: { name: 'Mary Smith' } },
      ];
      mockMedicleRecordService.getAllMedicleRecordsWithMother = jest.fn().mockResolvedValue(mockRecordsWithMothers);

      // Act
      await getAllMedicleRecordsWithMotherController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.getAllMedicleRecordsWithMother).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Medicle records with mother fetched successfully',
        data: mockRecordsWithMothers,
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockMedicleRecordService.getAllMedicleRecordsWithMother = jest.fn().mockRejectedValue(error);

      // Act
      await getAllMedicleRecordsWithMotherController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Medicle records with mother fetch failed',
      });
    });
  });

  describe('createMedicalRecordAndPredictController', () => {
    it('should create medical record with prediction successfully', async () => {
      // Arrange
      const motherNic = '920123456V';
      mockRequest.params = { motherId: motherNic };
      mockRequest.body = {
        height: 165,
        weight: 65,
        bloodPressure: 120,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Regular checkup',
        bpStr: '120/80',
        age: 28,
        isSaving: true,
      };

      const expectedResult = {
        record: mockMedicalRecords.normalRecord,
        prediction: { risk: 'low_risk', confidence: 0.85 },
      };
      mockMedicleRecordService.createMedicalRecordAndPredict = jest.fn().mockResolvedValue(expectedResult);

      // Act
      await createMedicalRecordAndPredictController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.createMedicalRecordAndPredict).toHaveBeenCalledWith({
        motherNic,
        height: 165,
        weight: 65,
        bloodPressure: 120,
        sugarLevel: 90,
        gestationalAge: 20,
        notes: 'Regular checkup',
        bpStr: '120/80',
        age: 28,
        isSaving: true,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 201,
        message: 'Medical record created with prediction',
        data: expectedResult,
      });
    });

    it('should handle missing mother NIC', async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.body = {
        height: 165,
        weight: 65,
      };

      // Act
      await createMedicalRecordAndPredictController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'mother nic is required (as path param or in body)',
        data: null,
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const motherNic = '920123456V';
      mockRequest.params = { motherId: motherNic };
      mockRequest.body = { height: 165, weight: 65 };

      const error = new Error('Prediction service unavailable');
      mockMedicleRecordService.createMedicalRecordAndPredict = jest.fn().mockRejectedValue(error);

      // Act
      await createMedicalRecordAndPredictController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Prediction service unavailable',
        data: null,
      });
    });

    it('should handle null/undefined values correctly', async () => {
      // Arrange
      const motherNic = '920123456V';
      mockRequest.params = { motherId: motherNic };
      mockRequest.body = {
        height: '',
        weight: null,
        bloodPressure: undefined,
        sugarLevel: 'invalid',
        gestationalAge: 20,
        notes: null,
      };

      const expectedResult = { record: mockMedicalRecords.normalRecord, prediction: {} };
      mockMedicleRecordService.createMedicalRecordAndPredict = jest.fn().mockResolvedValue(expectedResult);

      // Act
      await createMedicalRecordAndPredictController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMedicleRecordService.createMedicalRecordAndPredict).toHaveBeenCalledWith({
        motherNic,
        height: null,
        weight: null,
        bloodPressure: null,
        sugarLevel: null,
        gestationalAge: 20,
        notes: null,
        bpStr: undefined,
        age: undefined,
        isSaving: false,
      });
    });
  });
});