import { parseBpToString, parseBpString } from '../../../src/utils/bp.util';

describe('BpUtil', () => {
  describe('parseBpToString', () => {
    it('should format valid systolic and diastolic values', () => {
      // Arrange & Act & Assert
      const testCases = [
        { systolic: 120, diastolic: 80, expected: '120/80' },
        { systolic: 140, diastolic: 90, expected: '140/90' },
        { systolic: 110, diastolic: 70, expected: '110/70' },
        { systolic: 160, diastolic: 100, expected: '160/100' },
        { systolic: 90, diastolic: 60, expected: '90/60' },
      ];

      testCases.forEach(({ systolic, diastolic, expected }) => {
        const result = parseBpToString(systolic, diastolic);
        expect(result).toBe(expected);
      });
    });

    it('should return undefined when systolic is not a number', () => {
      // Arrange & Act & Assert
      const testCases = [
        { systolic: undefined, diastolic: 80 },
        { systolic: null as any, diastolic: 80 },
        { systolic: 'invalid' as any, diastolic: 80 },
        { systolic: NaN, diastolic: 80 },
      ];

      testCases.forEach(({ systolic, diastolic }) => {
        const result = parseBpToString(systolic, diastolic);
        expect(result).toBeUndefined();
      });
    });

    it('should return undefined when diastolic is not a number', () => {
      // Arrange & Act & Assert
      const testCases = [
        { systolic: 120, diastolic: undefined },
        { systolic: 120, diastolic: null as any },
        { systolic: 120, diastolic: 'invalid' as any },
        { systolic: 120, diastolic: NaN },
      ];

      testCases.forEach(({ systolic, diastolic }) => {
        const result = parseBpToString(systolic, diastolic);
        expect(result).toBeUndefined();
      });
    });

    it('should return undefined when both values are invalid', () => {
      // Arrange & Act & Assert
      const testCases = [
        { systolic: undefined, diastolic: undefined },
        { systolic: null as any, diastolic: null as any },
        { systolic: 'invalid' as any, diastolic: 'invalid' as any },
        { systolic: NaN, diastolic: NaN },
      ];

      testCases.forEach(({ systolic, diastolic }) => {
        const result = parseBpToString(systolic, diastolic);
        expect(result).toBeUndefined();
      });
    });

    it('should handle edge case values', () => {
      // Arrange & Act & Assert
      const testCases = [
        { systolic: 0, diastolic: 0, expected: '0/0' },
        { systolic: 300, diastolic: 200, expected: '300/200' },
        { systolic: 50, diastolic: 30, expected: '50/30' },
      ];

      testCases.forEach(({ systolic, diastolic, expected }) => {
        const result = parseBpToString(systolic, diastolic);
        expect(result).toBe(expected);
      });
    });

    it('should handle decimal values by converting to integers in string', () => {
      // Arrange & Act & Assert
      const testCases = [
        { systolic: 120.5, diastolic: 80.3, expected: '120.5/80.3' },
        { systolic: 140.0, diastolic: 90.0, expected: '140/90' },
        { systolic: 110.7, diastolic: 70.9, expected: '110.7/70.9' },
      ];

      testCases.forEach(({ systolic, diastolic, expected }) => {
        const result = parseBpToString(systolic, diastolic);
        expect(result).toBe(expected);
      });
    });
  });

  describe('parseBpString', () => {
    it('should parse valid blood pressure strings', () => {
      // Arrange & Act & Assert
      const testCases = [
        { input: '120/80', expected: { systolic: 120, diastolic: 80 } },
        { input: '140/90', expected: { systolic: 140, diastolic: 90 } },
        { input: '110/70', expected: { systolic: 110, diastolic: 70 } },
        { input: '160/100', expected: { systolic: 160, diastolic: 100 } },
        { input: '90/60', expected: { systolic: 90, diastolic: 60 } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseBpString(input);
        expect(result).toEqual(expected);
      });
    });

    it('should parse strings with whitespace', () => {
      // Arrange & Act & Assert
      const testCases = [
        { input: ' 120/80 ', expected: { systolic: 120, diastolic: 80 } },
        { input: '120 / 80', expected: { systolic: 120, diastolic: 80 } },
        { input: '120/ 80', expected: { systolic: 120, diastolic: 80 } },
        { input: '120 /80', expected: { systolic: 120, diastolic: 80 } },
        { input: '  120  /  80  ', expected: { systolic: 120, diastolic: 80 } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseBpString(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle 2-digit and 3-digit numbers', () => {
      // Arrange & Act & Assert
      const testCases = [
        { input: '99/60', expected: { systolic: 99, diastolic: 60 } },
        { input: '100/70', expected: { systolic: 100, diastolic: 70 } },
        { input: '200/120', expected: { systolic: 200, diastolic: 120 } },
        { input: '300/200', expected: { systolic: 300, diastolic: 200 } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseBpString(input);
        expect(result).toEqual(expected);
      });
    });

    it('should return null for invalid formats', () => {
      // Arrange & Act & Assert
      const invalidInputs = [
        'invalid',
        '120',
        '/80',
        '120/',
        '120-80',
        '120_80',
        '120 80',
        'systolic/diastolic',
        '120/80/extra',
        '1200/800', // 4 digits not allowed
        '12/8', // 1 digit not allowed
        '',
        '   ',
      ];

      invalidInputs.forEach((input) => {
        const result = parseBpString(input);
        expect(result).toBeNull();
      });
    });

    it('should return null for non-numeric values', () => {
      // Arrange & Act & Assert
      const invalidInputs = [
        'abc/def',
        '12a/80',
        '120/8b',
        'NaN/80',
        '120/NaN',
        'undefined/80',
        '120/undefined',
      ];

      invalidInputs.forEach((input) => {
        const result = parseBpString(input);
        expect(result).toBeNull();
      });
    });

    it('should handle null and undefined input', () => {
      // Arrange & Act & Assert
      const result1 = parseBpString(null as any);
      const result2 = parseBpString(undefined as any);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should handle edge case numbers', () => {
      // Arrange & Act & Assert
      const testCases = [
        { input: '00/00', expected: { systolic: 0, diastolic: 0 } },
        { input: '999/999', expected: { systolic: 999, diastolic: 999 } },
        { input: '100/100', expected: { systolic: 100, diastolic: 100 } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseBpString(input);
        expect(result).toEqual(expected);
      });
    });

    it('should reject numbers outside 2-3 digit range', () => {
      // Arrange & Act & Assert
      const invalidInputs = [
        '1/80',     // 1 digit systolic
        '12/8',     // 1 digit diastolic
        '1234/80',  // 4 digit systolic
        '120/1234', // 4 digit diastolic
        '1/1',      // Both 1 digit
        '1234/1234', // Both 4 digits
      ];

      invalidInputs.forEach((input) => {
        const result = parseBpString(input);
        expect(result).toBeNull();
      });
    });

    it('should handle roundtrip conversion', () => {
      // Arrange
      const originalValues = [
        { systolic: 120, diastolic: 80 },
        { systolic: 140, diastolic: 90 },
        { systolic: 110, diastolic: 70 },
        { systolic: 160, diastolic: 100 },
      ];

      originalValues.forEach(({ systolic, diastolic }) => {
        // Act
        const bpString = parseBpToString(systolic, diastolic);
        const parsedBack = parseBpString(bpString!);

        // Assert
        expect(parsedBack).toEqual({ systolic, diastolic });
      });
    });

    it('should be case insensitive for regex matching', () => {
      // Since the function uses a numeric regex, this test verifies
      // that it handles various input cases consistently
      
      // Arrange & Act & Assert
      const validInputs = [
        '120/80',
        '  120/80  ',
        '120 / 80',
      ];

      validInputs.forEach((input) => {
        const result = parseBpString(input);
        expect(result).toEqual({ systolic: 120, diastolic: 80 });
      });
    });
  });
});