import { calculateBlackScholes, getCalculationHistory, getCalculationById } from '../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('calculateBlackScholes', () => {
    it('should successfully calculate Black-Scholes prices', async () => {
      const mockResponse = {
        id: 1,
        s0: 100,
        x: 100,
        t: 1,
        r: 0.05,
        d: 0.02,
        v: 0.2,
        call_price: 10.45,
        put_price: 5.23,
        d1: 0.25,
        d2: 0.05,
        created_at: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const input = {
        s0: 100,
        x: 100,
        t: 1,
        r: 0.05,
        d: 0.02,
        v: 0.2,
      };

      const result = await calculateBlackScholes(input);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/calculate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid input' }),
      });

      const input = {
        s0: -100,
        x: 100,
        t: 1,
        r: 0.05,
        d: 0.02,
        v: 0.2,
      };

      await expect(calculateBlackScholes(input)).rejects.toThrow('Invalid input');
    });
  });

  describe('getCalculationHistory', () => {
    it('should fetch calculation history', async () => {
      const mockHistory = [
        {
          id: 1,
          s0: 100,
          x: 100,
          t: 1,
          r: 0.05,
          d: 0.02,
          v: 0.2,
          call_price: 10.45,
          put_price: 5.23,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await getCalculationHistory();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/history');
      expect(result).toEqual(mockHistory);
    });

    it('should handle empty history', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getCalculationHistory();

      expect(result).toEqual([]);
    });
  });

  describe('getCalculationById', () => {
    it('should fetch a specific calculation', async () => {
      const mockCalculation = {
        id: 1,
        s0: 100,
        x: 100,
        t: 1,
        r: 0.05,
        d: 0.02,
        v: 0.2,
        call_price: 10.45,
        put_price: 5.23,
        d1: 0.25,
        d2: 0.05,
        created_at: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCalculation,
      });

      const result = await getCalculationById(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/history/1');
      expect(result).toEqual(mockCalculation);
    });
  });
});
