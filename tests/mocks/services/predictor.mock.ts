// Mock external predictor service
export const mockPredictorService = {
  predict: jest.fn().mockResolvedValue({
    prediction: 'low_risk',
    confidence: 0.85,
    factors: ['normal_bp', 'healthy_weight'],
  }),
  
  predictHighRisk: jest.fn().mockResolvedValue({
    prediction: 'high_risk',
    confidence: 0.92,
    factors: ['high_bp', 'elevated_weight'],
  }),
  
  predictMediumRisk: jest.fn().mockResolvedValue({
    prediction: 'medium_risk',
    confidence: 0.75,
    factors: ['borderline_bp'],
  }),
  
  error: jest.fn().mockRejectedValue(new Error('Predictor service unavailable')),
};

export const mockPredictionResponses = {
  lowRisk: {
    data: {
      prediction: 'low_risk',
      confidence: 0.85,
      factors: ['normal_bp', 'healthy_weight'],
      recommendations: ['Continue regular checkups', 'Maintain healthy lifestyle'],
    },
  },
  
  highRisk: {
    data: {
      prediction: 'high_risk',
      confidence: 0.92,
      factors: ['high_bp', 'elevated_weight', 'age_factor'],
      recommendations: ['Immediate medical attention', 'Blood pressure monitoring', 'Specialist consultation'],
    },
  },
  
  mediumRisk: {
    data: {
      prediction: 'medium_risk',
      confidence: 0.75,
      factors: ['borderline_bp', 'family_history'],
      recommendations: ['Increased monitoring', 'Lifestyle modifications'],
    },
  },
  
  serviceError: {
    response: {
      status: 500,
      data: { error: 'Internal server error' },
    },
  },
};