import React, { useState, FormEvent } from 'react';
import { CalculationInput, BatchCalculationResponse } from '../types';
import { batchCalculateBlackScholes } from '../services/api';

interface BatchCalculatorProps {
  onResults?: (results: BatchCalculationResponse) => void;
}

export const BatchCalculator: React.FC<BatchCalculatorProps> = ({ onResults }) => {
  const [calculations, setCalculations] = useState<CalculationInput[]>([
    { s0: 100, x: 100, t: 1, r: 5, d: 2, v: 20 } as unknown as CalculationInput,
  ]);
  const [results, setResults] = useState<BatchCalculationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
      // Convert percentages to decimals
      const payload = {
        calculations: calculations.map((calc) => ({
          ...calc,
          r: calc.r / 100,
          d: calc.d / 100,
          v: calc.v / 100,
        })),
      };

      const response = await batchCalculateBlackScholes(payload);
      setResults(response);
      if (onResults) {
        onResults(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate batch');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => value.toFixed(4);

  if (!isExpanded) {
    return (
      <div className="batch-calculator-compact">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="expand-batch-button"
        >
          + Batch Calculator (Calculate Multiple Options)
        </button>
      </div>
    );
  }

  return (
    <div className="batch-calculator-compact expanded">
      <div className="batch-header-compact">
        <h3>Batch Calculator</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="collapse-button"
        >
          −
        </button>
      </div>

      <form onSubmit={handleSubmit} className="batch-form-compact">
        <div className="batch-table-container-compact">
          <table className="batch-input-table-compact">
            <thead>
              <tr>
                <th>S₀</th>
                <th>X</th>
                <th>t</th>
                <th>r %</th>
                <th>d %</th>
                <th>v %</th>
                <th></th>
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
                    <div className="input-with-symbol-inline">
                      <input
                        type="number"
                        value={calc.r}
                        onChange={(e) => updateCalculation(index, 'r', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        max="100"
                        required
                      />
                      <span className="input-symbol-inline">%</span>
                    </div>
                  </td>
                  <td>
                    <div className="input-with-symbol-inline">
                      <input
                        type="number"
                        value={calc.d}
                        onChange={(e) => updateCalculation(index, 'd', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        max="100"
                        required
                      />
                      <span className="input-symbol-inline">%</span>
                    </div>
                  </td>
                  <td>
                    <div className="input-with-symbol-inline">
                      <input
                        type="number"
                        value={calc.v}
                        onChange={(e) => updateCalculation(index, 'v', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        max="100"
                        required
                      />
                      <span className="input-symbol-inline">%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="remove-row-button-compact"
                      disabled={calculations.length === 1}
                      title="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="batch-actions-compact">
          <button type="button" onClick={addRow} className="add-row-button-compact">
            + Add Row
          </button>
          <button type="submit" disabled={isLoading || calculations.length === 0} className="submit-button-compact">
            {isLoading ? 'Calculating...' : `Calculate ${calculations.length} Option${calculations.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="batch-results-compact">
          <div className="batch-summary-compact">
            <p>
              <strong>Results:</strong> {results.successful} successful, {results.failed} failed
            </p>
          </div>

          {results.results.length > 0 && (
            <div className="batch-results-table-container-compact">
              <table className="batch-results-table-compact">
                <thead>
                  <tr>
                    <th>S₀</th>
                    <th>X</th>
                    <th>t</th>
                    <th>Call</th>
                    <th>Put</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((result) => (
                    <tr key={result.id}>
                      <td>${formatCurrency(result.s0)}</td>
                      <td>${formatCurrency(result.x)}</td>
                      <td>{result.t.toFixed(2)}</td>
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
