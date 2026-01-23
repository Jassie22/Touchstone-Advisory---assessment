export interface CalculationInput {
  s0: number; // Current stock price
  x: number;  // Strike price
  t: number;  // Time to maturity in years
  r: number;  // Risk-free interest rate (decimal)
  d: number;  // Dividend yield (decimal)
  v: number;  // Volatility (decimal)
}

export interface CalculationResult {
  id: number;
  s0: number;
  x: number;
  t: number;
  r: number;
  d: number;
  v: number;
  call_price: number;
  put_price: number;
  d1: number;
  d2: number;
  created_at: string;
}

export interface CalculationSummary {
  id: number;
  s0: number;
  x: number;
  t: number;
  r: number;
  d: number;
  v: number;
  call_price: number;
  put_price: number;
  created_at: string;
}

export interface BatchCalculationRequest {
  calculations: CalculationInput[];
}

export interface BatchCalculationResponse {
  results: CalculationResult[];
  total: number;
  successful: number;
  failed: number;
}
