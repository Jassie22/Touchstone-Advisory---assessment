import React, { useState, FormEvent } from 'react';
import { CalculationInput, BatchCalculationResponse } from '../types';
import { batchCalculateBlackScholes } from '../services/api';

type RateInputMode = 'percent' | 'decimal';

export const BatchCalculator: React.FC = () => {
  const [calculations, setCalculations] = useState<CalculationInput[]>([
    { s0: 100, x: 100, t: 1, r: 5, d: 2, v: 20 } as unknown as CalculationInput,
  ]);
  const [rateMode, setRateMode] = useState<RateInputMode>('percent');
  const [results, setResults] = useState<BatchCalculationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => {
    setCalculations([...calculations, { s0: 100, x: 100, t: 1, r: 5, d: 2, v: 20 } as unknown as CalculationInput]);
  };

  const removeRow = (index: number) => {
    setCalculations(calculations.filter((_, i) => i !== index));
  };

  const updateCalculation = (index: number, field: keyof CalculationInput, value: number) => {
    const updated = [...calculations];
    updated[index] = { ...updated[index], [field]: value };
    setCalculations(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const toDecimal = (value: number) => (rateMode === 'percent' ? value / 100 : value);

      const payload = {
        calculations: calculations.map((calc) => ({
          ...calc,
          r: toDecimal(calc.r),
          d: toDecimal(calc.d),
          v: toDecimal(calc.v),
        })),
      };

      const response = await batchCalculateBlackScholes(payload);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate batch');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => value.toFixed(4);

  return (
    <div className="batch-calculator">
      <div className="batch-header">
        <h2>Batch Calculator</h2>
        <p className="panel-subtitle">Calculate multiple option prices at once</p>
        <div className="rate-mode-toggle">
          <span>Rate input:</span>
          <button
            type="button"
            className={rateMode === 'percent' ? 'toggle-option active' : 'toggle-option'}
            onClick={() => setRateMode('percent')}
          >
            Percent (%)
          </button>
          <button
            type="button"
            className={rateMode === 'decimal' ? 'toggle-option active' : 'toggle-option'}
            onClick={() => setRateMode('decimal')}
          >
            Decimal
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="batch-form">
        <div className="batch-table-container">
          <table className="batch-input-table">
            <thead>
              <tr>
                <th>S₀</th>
                <th>X</th>
                <th>t (years)</th>
                <th>r {rateMode === 'percent' ? '(%)' : '(decimal)'}</th>
                <th>d {rateMode === 'percent' ? '(%)' : '(decimal)'}</th>
                <th>v {rateMode === 'percent' ? '(%)' : '(decimal)'}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calculations.map((calc, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="number"
                      value={calc.s0}
                      onChange={(e) => updateCalculation(index, 's0', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={calc.x}
                      onChange={(e) => updateCalculation(index, 'x', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={calc.t}
                      onChange={(e) => updateCalculation(index, 't', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={calc.r}
                      onChange={(e) => updateCalculation(index, 'r', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={calc.d}
                      onChange={(e) => updateCalculation(index, 'd', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={calc.v}
                      onChange={(e) => updateCalculation(index, 'v', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      required
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="remove-row-button"
                      disabled={calculations.length === 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="batch-actions">
          <button type="button" onClick={addRow} className="add-row-button">
            + Add Row
          </button>
          <button type="submit" disabled={isLoading || calculations.length === 0} className="submit-button">
            {isLoading ? 'Calculating...' : `Calculate ${calculations.length} Option${calculations.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="batch-results">
          <div className="batch-summary">
            <h3>Batch Results</h3>
            <p>
              Successful: <strong>{results.successful}</strong> | Failed: <strong>{results.failed}</strong> | Total:{' '}
              <strong>{results.total}</strong>
            </p>
          </div>

          {results.results.length > 0 && (
            <div className="batch-results-table-container">
              <table className="batch-results-table">
                <thead>
                  <tr>
                    <th>S₀</th>
                    <th>X</th>
                    <th>t</th>
                    <th>r</th>
                    <th>d</th>
                    <th>v</th>
                    <th>Call Price</th>
                    <th>Put Price</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((result) => (
                    <tr key={result.id}>
                      <td>${formatCurrency(result.s0)}</td>
                      <td>${formatCurrency(result.x)}</td>
                      <td>{result.t.toFixed(2)}</td>
                      <td>{(result.r * 100).toFixed(2)}%</td>
                      <td>{(result.d * 100).toFixed(2)}%</td>
                      <td>{(result.v * 100).toFixed(2)}%</td>
                      <td className="price-cell">${formatCurrency(result.call_price)}</td>
                      <td className="price-cell">${formatCurrency(result.put_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
