import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { CalculationResult } from '../types';

describe('ResultsDisplay', () => {
  const mockResult: CalculationResult = {
    id: 1,
    s0: 100,
    x: 100,
    t: 1,
    r: 0.05,
    d: 0.02,
    v: 0.2,
    call_price: 10.4512,
    put_price: 5.2345,
    d1: 0.251234,
    d2: 0.051234,
    created_at: '2024-01-01T12:00:00Z',
  };

  it('renders nothing when result is null', () => {
    const { container } = render(<ResultsDisplay result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays call and put prices', () => {
    render(<ResultsDisplay result={mockResult} />);

    expect(screen.getByText(/call option price/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10\.4512/i)).toBeInTheDocument();
    expect(screen.getByText(/put option price/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5\.2345/i)).toBeInTheDocument();
  });

  it('displays intermediate values d1 and d2', () => {
    render(<ResultsDisplay result={mockResult} />);

    expect(screen.getByText(/d1/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.251234/i)).toBeInTheDocument();
    expect(screen.getByText(/d2/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.051234/i)).toBeInTheDocument();
  });

  it('displays calculation timestamp', () => {
    render(<ResultsDisplay result={mockResult} />);

    expect(screen.getByText(/calculated at/i)).toBeInTheDocument();
    // The exact date format may vary, so we just check that a date is shown
    expect(screen.getByText(/2024/i)).toBeInTheDocument();
  });
});
