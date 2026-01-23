import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryView } from '../components/HistoryView';
import { getCalculationHistory } from '../services/api';

jest.mock('../services/api');

describe('HistoryView', () => {
  const mockGetHistory = getCalculationHistory as jest.MockedFunction<typeof getCalculationHistory>;

  beforeEach(() => {
    mockGetHistory.mockClear();
  });

  it('displays loading state initially', () => {
    mockGetHistory.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<HistoryView />);

    expect(screen.getByText(/loading history/i)).toBeInTheDocument();
  });

  it('displays calculation history', async () => {
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
        created_at: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        s0: 110,
        x: 100,
        t: 0.5,
        r: 0.03,
        d: 0.01,
        v: 0.25,
        call_price: 15.67,
        put_price: 3.45,
        created_at: '2024-01-02T12:00:00Z',
      },
    ];

    mockGetHistory.mockResolvedValueOnce(mockHistory);

    render(<HistoryView />);

    await waitFor(() => {
      expect(screen.getByText(/calculation history/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/\$100\.0000/i)).toBeInTheDocument();
    expect(screen.getByText(/\$110\.0000/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10\.4500/i)).toBeInTheDocument();
    expect(screen.getByText(/\$15\.6700/i)).toBeInTheDocument();
  });

  it('displays empty state when no history', async () => {
    mockGetHistory.mockResolvedValueOnce([]);

    render(<HistoryView />);

    await waitFor(() => {
      expect(screen.getByText(/no calculation history available/i)).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    mockGetHistory.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<HistoryView />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('allows refreshing history', async () => {
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
        created_at: '2024-01-01T12:00:00Z',
      },
    ];

    mockGetHistory.mockResolvedValue(mockHistory);

    render(<HistoryView />);

    await waitFor(() => {
      expect(screen.getByText(/calculation history/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    refreshButton.click();

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledTimes(2);
    });
  });
});
