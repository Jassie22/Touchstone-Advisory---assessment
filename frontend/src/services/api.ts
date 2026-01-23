import { CalculationInput, CalculationResult, CalculationSummary } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function calculateBlackScholes(
  input: CalculationInput
): Promise<CalculationResult> {
  const response = await fetch(`${API_BASE_URL}/api/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleResponse<CalculationResult>(response);
}

export async function getCalculationHistory(): Promise<CalculationSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/history`);
  return handleResponse<CalculationSummary[]>(response);
}

export async function getCalculationById(id: number): Promise<CalculationResult> {
  const response = await fetch(`${API_BASE_URL}/api/history/${id}`);
  return handleResponse<CalculationResult>(response);
}
