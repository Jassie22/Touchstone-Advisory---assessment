import { CalculationInput, CalculationResult, CalculationSummary, BatchCalculationRequest, BatchCalculationResponse } from '../types';

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

export async function getCalculationHistory(skip: number = 0, limit: number = 10): Promise<CalculationSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/history?skip=${skip}&limit=${limit}`);
  return handleResponse<CalculationSummary[]>(response);
}

export async function getCalculationById(id: number): Promise<CalculationResult> {
  const response = await fetch(`${API_BASE_URL}/api/history/${id}`);
  return handleResponse<CalculationResult>(response);
}

export async function batchCalculateBlackScholes(
  request: BatchCalculationRequest
): Promise<BatchCalculationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calculate/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse<BatchCalculationResponse>(response);
}

export async function deleteHistoryEntries(ids: number[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/history`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
}
