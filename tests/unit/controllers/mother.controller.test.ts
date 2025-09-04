import { Request, Response } from 'express';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockMothers } from '../../mocks/data/mothers.mock';

// Mock the MotherService at the module level
const mockMotherService = {
  getAllMothersList: jest.fn(),
  getMotherByUserId: jest.fn(),
};

jest.mock('../../../src/services/mother.service', () => {
  return {
    MotherService: jest.fn().mockImplementation(() => mockMotherService)
  };
});

// Import the controller after mocking
const { getAllMothers, getMotherProfileById } = require('../../../src/controllers/mother.controller');

describe('MotherController', () => {
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
      user: { id: 'user-123', email: 'test@example.com', role: 'CLINIC_USER' }, // Mock authenticated user
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Clear all mocks
    jest.clearAllMocks();
    mockDatabase.reset();
    mockMotherService.getAllMothersList.mockReset();
    mockMotherService.getMotherByUserId.mockReset();
  });

  describe('getAllMothers', () => {
    it('should return all mothers successfully', async () => {
      // Arrange
      const expectedMothers = [mockMothers.validMother1, mockMothers.validMother2];
      mockMotherService.getAllMothersList = jest.fn().mockResolvedValue(expectedMothers);

      // Act
      await getAllMothers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getAllMothersList).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Mothers list fetched successfully',
        data: expectedMothers,
      });
    });

    it('should handle empty mothers list', async () => {
      // Arrange
      const emptyList: any[] = [];
      mockMotherService.getAllMothersList = jest.fn().mockResolvedValue(emptyList);

      // Act
      await getAllMothers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getAllMothersList).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Mothers list fetched successfully',
        data: emptyList,
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockMotherService.getAllMothersList = jest.fn().mockRejectedValue(error);

      // Act
      await getAllMothers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getAllMothersList).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Database connection failed',
      });
    });

    it('should handle unknown errors', async () => {
      // Arrange
      const error = new Error();
      mockMotherService.getAllMothersList = jest.fn().mockRejectedValue(error);

      // Act
      await getAllMothers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Mothers list fetch failed',
      });
    });
  });

  describe('getMotherProfileById', () => {
    it('should return mother profile for valid user ID', async () => {
      // Arrange
      const userId = 'user-123';
      mockRequest.params = { id: userId };
      const expectedProfile = mockMothers.validMother1;
      mockMotherService.getMotherByUserId = jest.fn().mockResolvedValue(expectedProfile);

      // Act
      await getMotherProfileById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getMotherByUserId).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Mother profile fetched successfully',
        data: expectedProfile,
      });
    });

    it('should handle non-existent user ID', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockRequest.params = { id: userId };
      const error = new Error('Mother profile not found');
      mockMotherService.getMotherByUserId = jest.fn().mockRejectedValue(error);

      // Act
      await getMotherProfileById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getMotherByUserId).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Mother profile not found',
      });
    });

    it('should handle missing user ID parameter', async () => {
      // Arrange
      mockRequest.params = {}; // No id parameter
      const error = new Error('User ID is required');
      mockMotherService.getMotherByUserId = jest.fn().mockRejectedValue(error);

      // Act
      await getMotherProfileById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getMotherByUserId).toHaveBeenCalledWith(undefined);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'User ID is required',
      });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      mockRequest.params = { id: userId };
      const error = new Error();
      mockMotherService.getMotherByUserId = jest.fn().mockRejectedValue(error);

      // Act
      await getMotherProfileById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Mother profile fetch failed',
      });
    });

    it('should handle different user IDs', async () => {
      // Arrange
      const userId = 'user-456';
      mockRequest.params = { id: userId };
      const expectedProfile = mockMothers.validMother2;
      mockMotherService.getMotherByUserId = jest.fn().mockResolvedValue(expectedProfile);

      // Act
      await getMotherProfileById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMotherService.getMotherByUserId).toHaveBeenCalledWith(userId);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Mother profile fetched successfully',
        data: expectedProfile,
      });
    });
  });
});