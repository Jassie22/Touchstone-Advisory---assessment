import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculatorForm } from '../components/CalculatorForm';
import { CalculationInput } from '../types';

describe('CalculatorForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all input fields', () => {
    render(<CalculatorForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/current stock price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/strike price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time to maturity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/risk-free interest rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dividend yield/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/volatility/i)).toBeInTheDocument();
  });

  it('has default values', () => {
    render(<CalculatorForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/current stock price/i)).toHaveValue(100);
    expect(screen.getByLabelText(/strike price/i)).toHaveValue(100);
    expect(screen.getByLabelText(/time to maturity/i)).toHaveValue(1);
  });

  it('allows user to input values', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm onSubmit={mockOnSubmit} />);

    const s0Input = screen.getByLabelText(/current stock price/i);
    await user.clear(s0Input);
    await user.type(s0Input, '110');

    expect(s0Input).toHaveValue(110);
  });

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /calculate/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedInput: CalculationInput = {
      s0: 100,
      x: 100,
      t: 1,
      r: 0.05,
      d: 0.02,
      v: 0.2,
    };

    expect(mockOnSubmit).toHaveBeenCalledWith(expectedInput);
  });

  it('shows validation error for negative stock price', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm onSubmit={mockOnSubmit} />);

    const s0Input = screen.getByLabelText(/current stock price/i);
    await user.clear(s0Input);
    await user.type(s0Input, '-100');

    const submitButton = screen.getByRole('button', { name: /calculate/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/s0 must be greater than 0/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when loading', () => {
    render(<CalculatorForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /calculating/i });
    expect(submitButton).toBeDisabled();
  });
});
