import { PredictorClient, PredictRequest } from '../../../src/clients/predictor.client';
import { mockDatabase } from '../../setup/mockDatabase';
import { mockPredictionResponses } from '../../mocks/services/predictor.mock';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('PredictorClient', () => {
  let predictorClient: PredictorClient;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    predictorClient = new PredictorClient();
    jest.clearAllMocks();
    mockDatabase.reset();
    
    // Reset environment variables
    process.env.PREDICT_API_BASE = 'http://localhost:5000';
    process.env.PREDICT_API_TIMEOUT_MS = '4000';
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('predict', () => {
    it('should make successful prediction request', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      const expectedResponse = {
        code: 200,
        message: 'Success',
        data: {
          feature_vector: {
            Age: 28,
            BMI: 23.9,
            Diastolic: 80,
            Height_cm: 165,
            RuleRiskScore: 2,
            Sugar_mg_dL: 90,
            Systolic: 120,
            Weight_kg: 65,
          },
          flags: [],
          override_applied: false,
          predicted_label: 'Low',
          predicted_proba: { Low: 0.85, Medium: 0.12, High: 0.03 },
        },
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      // Act
      const result = await predictorClient.predict(input);

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/predict',
        input,
        {
          timeout: 4000,
          headers: { 'Content-Type': 'application/json' },
          validateStatus: expect.any(Function),
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle high risk prediction', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 35,
        height_cm: 160,
        weight_kg: 85,
        bp_str: '150/95',
        sugar_mg_dL: 140,
      };

      const expectedResponse = {
        code: 200,
        message: 'Success',
        data: {
          feature_vector: {
            Age: 35,
            BMI: 33.2,
            Diastolic: 95,
            Height_cm: 160,
            RuleRiskScore: 8,
            Sugar_mg_dL: 140,
            Systolic: 150,
            Weight_kg: 85,
          },
          flags: ['high_bp', 'elevated_bmi', 'high_sugar'],
          override_applied: false,
          predicted_label: 'High',
          predicted_proba: { Low: 0.05, Medium: 0.25, High: 0.70 },
        },
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      // Act
      const result = await predictorClient.predict(input);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.data.predicted_label).toBe('High');
      expect(result.data.flags).toContain('high_bp');
    });

    it('should handle medium risk prediction', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 32,
        height_cm: 168,
        weight_kg: 75,
        bp_str: '135/85',
        sugar_mg_dL: 105,
      };

      const expectedResponse = {
        code: 200,
        message: 'Success',
        data: {
          feature_vector: {
            Age: 32,
            BMI: 26.6,
            Diastolic: 85,
            Height_cm: 168,
            RuleRiskScore: 4,
            Sugar_mg_dL: 105,
            Systolic: 135,
            Weight_kg: 75,
          },
          flags: ['borderline_bp'],
          override_applied: false,
          predicted_label: 'Medium',
          predicted_proba: { Low: 0.25, Medium: 0.60, High: 0.15 },
        },
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      // Act
      const result = await predictorClient.predict(input);

      // Assert
      expect(result.data.predicted_label).toBe('Medium');
      expect(result.data.predicted_proba.Medium).toBeGreaterThan(0.5);
    });

    it('should throw error for HTTP 4xx status', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 400,
        data: {
          code: 400,
          message: 'Bad Request',
          data: null,
        },
      });

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow(
        'Predict API error: HTTP 400, code 400'
      );
    });

    it('should throw error for HTTP 5xx status', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 500,
        data: {
          code: 500,
          message: 'Internal Server Error',
          data: null,
        },
      });

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow(
        'Predict API error: HTTP 500, code 500'
      );
    });

    it('should throw error for response code >= 400', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: {
          code: 400,
          message: 'Validation Error',
          data: null,
        },
      });

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow(
        'Predict API error: HTTP 200, code 400'
      );
    });

    it('should throw error for missing response data', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: null,
      });

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow(
        'Predict API error: HTTP 200, code undefined'
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockRejectedValue(new Error('Network Error'));

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockRejectedValue(new Error('timeout of 4000ms exceeded'));

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow('timeout of 4000ms exceeded');
    });

    it('should use custom API base URL from environment', async () => {
      // Arrange
      process.env.PREDICT_API_BASE = 'https://custom-api.example.com';
      const newClient = new PredictorClient();
      
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockPredictionResponses.lowRisk.data,
      });

      // Act
      await newClient.predict(input);

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://custom-api.example.com/predict',
        input,
        expect.any(Object)
      );
    });

    it('should use custom timeout from environment', async () => {
      // Arrange
      process.env.PREDICT_API_TIMEOUT_MS = '8000';
      const newClient = new PredictorClient();
      
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockPredictionResponses.lowRisk.data,
      });

      // Act
      await newClient.predict(input);

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        input,
        expect.objectContaining({
          timeout: 8000,
        })
      );
    });

    it('should handle various input edge cases', async () => {
      // Arrange
      const edgeCaseInputs = [
        {
          age: 18, // Minimum adult age
          height_cm: 140, // Short height
          weight_kg: 40, // Low weight
          bp_str: '90/60', // Low BP
          sugar_mg_dL: 70, // Low sugar
        },
        {
          age: 45, // Older age
          height_cm: 190, // Tall height
          weight_kg: 100, // High weight
          bp_str: '180/110', // High BP
          sugar_mg_dL: 200, // High sugar
        },
      ];

      const expectedResponse = mockPredictionResponses.lowRisk.data;
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: expectedResponse,
      });

      for (const input of edgeCaseInputs) {
        // Act
        const result = await predictorClient.predict(input);

        // Assert
        expect(result).toEqual(expectedResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          input,
          expect.any(Object)
        );
      }
    });

    it('should handle malformed blood pressure strings', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: 'invalid-bp-format',
        sugar_mg_dL: 90,
      };

      // The client should still send the request as-is
      // Server validation will handle the malformed BP string
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: {
          code: 400,
          message: 'Invalid blood pressure format',
          data: null,
        },
      });

      // Act & Assert
      await expect(predictorClient.predict(input)).rejects.toThrow(
        'Predict API error: HTTP 200, code 400'
      );
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        input,
        expect.any(Object)
      );
    });

    it('should validate status using validateStatus function', async () => {
      // Arrange
      const input: PredictRequest = {
        age: 28,
        height_cm: 165,
        weight_kg: 65,
        bp_str: '120/80',
        sugar_mg_dL: 90,
      };

      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockPredictionResponses.lowRisk.data,
      });

      // Act
      await predictorClient.predict(input);

      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        input,
        expect.objectContaining({
          validateStatus: expect.any(Function),
        })
      );

      // Test that validateStatus returns true for all status codes
      const config = (mockAxios.post as jest.Mock).mock.calls[0][2];
      expect(config.validateStatus()).toBe(true);
      expect(config.validateStatus(404)).toBe(true);
      expect(config.validateStatus(500)).toBe(true);
    });
  });
});