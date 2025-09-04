import { Request, Response } from 'express';
import { mockDatabase } from '../../setup/mockDatabase';

// Mock the DoctorService at the module level
const mockDoctorService = {
  getDashboardProps: jest.fn(),
};

jest.mock('../../../src/services/doctor.service', () => {
  return {
    DoctorService: jest.fn().mockImplementation(() => mockDoctorService)
  };
});

// Import the controller after mocking
const { doctorDashboard } = require('../../../src/controllers/doctor.controller');

describe('DoctorController', () => {
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
      user: { id: 'user-123', email: 'doctor@example.com', role: 'CLINIC_USER' },
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
    mockDatabase.reset();
    mockDoctorService.getDashboardProps.mockReset();
  });

  describe('doctorDashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      // Arrange
      const mockDashboardData = {
        totalMothers: 50,
        totalRecords: 125,
        highRiskCount: 8,
        recentRecords: [
          { id: 'record-1', motherName: 'Jane Doe', risk: 'low' },
          { id: 'record-2', motherName: 'Mary Smith', risk: 'high' },
        ],
        statistics: {
          lowRisk: 35,
          mediumRisk: 7,
          highRisk: 8,
        },
      };
      mockDoctorService.getDashboardProps = jest.fn().mockResolvedValue(mockDashboardData);

      // Act
      await doctorDashboard(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDoctorService.getDashboardProps).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Dashoard data fetched successfully',
        data: mockDashboardData,
      });
    });

    it('should handle empty dashboard data', async () => {
      // Arrange
      const emptyDashboardData = {
        totalMothers: 0,
        totalRecords: 0,
        highRiskCount: 0,
        recentRecords: [],
        statistics: {
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0,
        },
      };
      mockDoctorService.getDashboardProps = jest.fn().mockResolvedValue(emptyDashboardData);

      // Act
      await doctorDashboard(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDoctorService.getDashboardProps).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Dashoard data fetched successfully',
        data: emptyDashboardData,
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockDoctorService.getDashboardProps = jest.fn().mockRejectedValue(error);

      // Act
      await doctorDashboard(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDoctorService.getDashboardProps).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Dashboard data fetch failed',
      });
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const error = new Error();
      mockDoctorService.getDashboardProps = jest.fn().mockRejectedValue(error);

      // Act
      await doctorDashboard(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDoctorService.getDashboardProps).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        message: 'Dashboard data fetch failed',
      });
    });

    it('should handle large dashboard data sets', async () => {
      // Arrange
      const largeDashboardData = {
        totalMothers: 1000,
        totalRecords: 5000,
        highRiskCount: 150,
        recentRecords: Array.from({ length: 10 }, (_, i) => ({
          id: `record-${i + 1}`,
          motherName: `Mother ${i + 1}`,
          risk: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
        })),
        statistics: {
          lowRisk: 600,
          mediumRisk: 250,
          highRisk: 150,
        },
      };
      mockDoctorService.getDashboardProps = jest.fn().mockResolvedValue(largeDashboardData);

      // Act
      await doctorDashboard(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDoctorService.getDashboardProps).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Dashoard data fetched successfully',
        data: largeDashboardData,
      });
    });

    it('should handle partial dashboard data', async () => {
      // Arrange
      const partialDashboardData = {
        totalMothers: 25,
        totalRecords: 45,
        // Missing some optional fields
        recentRecords: [
          { id: 'record-1', motherName: 'Jane Doe' }, // Missing risk field
        ],
      };
      mockDoctorService.getDashboardProps = jest.fn().mockResolvedValue(partialDashboardData);

      // Act
      await doctorDashboard(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockDoctorService.getDashboardProps).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 200,
        message: 'Dashoard data fetched successfully',
        data: partialDashboardData,
      });
    });
  });
});