import React, { useState, FormEvent } from 'react';
import { CalculationInput } from '../types';
import { batchCalculateBlackScholes } from '../services/api';
import { BatchCalculationResponse } from '../types';

interface CalculatorFormProps {
  onSubmit: (input: CalculationInput) => void;
  onBatchResults?: (results: BatchCalculationResponse) => void;
  isLoading?: boolean;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  onSubmit,
  onBatchResults,
  isLoading = false,
}) => {
  const [rows, setRows] = useState<CalculationInput[]>([
    { s0: 100, x: 100, t: 1, r: 5 as unknown as number, d: 2 as unknown as number, v: 20 as unknown as number },
  ]);

  const [errors, setErrors] = useState<Record<number, Partial<Record<keyof CalculationInput, string>>>>({});

  const validateRow = (rowIndex: number, rowData: CalculationInput): Partial<Record<keyof CalculationInput, string>> => {
    const rowErrors: Partial<Record<keyof CalculationInput, string>> = {};

    Object.keys(rowData).forEach((key) => {
      const value = rowData[key as keyof CalculationInput];
      if (value === ('' as unknown as number) || value === (NaN as unknown as number)) {
        rowErrors[key as keyof CalculationInput] = `${key} is required`;
        return;
      }
      if (isNaN(value as number)) {
        rowErrors[key as keyof CalculationInput] = `${key} must be a number`;
        return;
      }

      if (key === 's0' || key === 'x' || key === 't') {
        if (value <= 0) {
          rowErrors[key as keyof CalculationInput] = `${key} must be greater than 0`;
        }
      }

      if (key === 'r' || key === 'd' || key === 'v') {
        if (value < 0 || value > 100) {
          rowErrors[key as keyof CalculationInput] = `${key} should be between 0 and 100`;
        }
      }
    });

    return rowErrors;
  };

  const handleChange = (rowIndex: number, field: keyof CalculationInput, value: string) => {
    const numValue = value === '' ? ('' as unknown as number) : parseFloat(value);
    
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [field]: numValue,
    };
    setRows(updatedRows);

    // Clear error for this field
    if (errors[rowIndex]?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[rowIndex]) {
          delete newErrors[rowIndex][field];
        }
        return newErrors;
      });
    }
  };

  const addRow = () => {
    setRows([...rows, { s0: 100, x: 100, t: 1, r: 5 as unknown as number, d: 2 as unknown as number, v: 20 as unknown as number }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        // Reindex errors
        const reindexed: Record<number, Partial<Record<keyof CalculationInput, string>>> = {};
        Object.keys(newErrors).forEach(key => {
          const oldIdx = Number(key);
          if (oldIdx > index) {
            reindexed[oldIdx - 1] = newErrors[oldIdx];
          } else if (oldIdx < index) {
            reindexed[oldIdx] = newErrors[oldIdx];
          }
        });
        return reindexed;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all rows
    const allErrors: Record<number, Partial<Record<keyof CalculationInput, string>>> = {};
    let hasErrors = false;

    rows.forEach((row, index) => {
      const rowErrors = validateRow(index, row);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[index] = rowErrors;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(allErrors);
      return;
    }

    // Convert percentages to decimals
    const processedRows = rows.map(row => ({
      ...row,
      r: row.r / 100,
      d: row.d / 100,
      v: row.v / 100,
    }));

    if (rows.length === 1) {
      // Single calculation
      onSubmit(processedRows[0]);
    } else {
      // Batch calculation
      try {
        const response = await batchCalculateBlackScholes({ calculations: processedRows });
        if (onBatchResults) {
          onBatchResults(response);
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to calculate batch');
      }
    }
  };

  return (
    <>
      <div className="calculator-intro">
        <h2>Black-Scholes Option Pricing Calculator</h2>
        <p>
          Calculate European option prices using the Black-Scholes model. Enter your market assumptions below.
          You can add multiple rows to calculate several options at once. All rates and volatility should be entered as percentages.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="calculator-form">
        <div className="form-header-compact">
          <h3 className="form-title">Input Parameters</h3>
          <p className="panel-subtitle">
            Enter market assumptions. Rates and volatility are entered as percentages.
          </p>
        </div>

        <div className="calculator-table-container">
          <table className="calculator-table">
            <thead>
              <tr>
                <th></th>
                <th>S<sub>0</sub></th>
                <th>X</th>
                <th>t (years)</th>
                <th>r (%)</th>
                <th>d (%)</th>
                <th>v (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="row-actions">
                    {rowIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => removeRow(rowIndex)}
                        className="remove-row-btn-table"
                        title="Remove row"
                      >
                        ×
                      </button>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.s0}
                      onChange={(e) => handleChange(rowIndex, 's0', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      className="table-input"
                    />
                    {errors[rowIndex]?.s0 && <div className="error-inline">{errors[rowIndex].s0}</div>}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.x}
                      onChange={(e) => handleChange(rowIndex, 'x', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      className="table-input"
                    />
                    {errors[rowIndex]?.x && <div className="error-inline">{errors[rowIndex].x}</div>}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.t}
                      onChange={(e) => handleChange(rowIndex, 't', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      className="table-input"
                    />
                    {errors[rowIndex]?.t && <div className="error-inline">{errors[rowIndex].t}</div>}
                  </td>
                  <td>
                    <div className="input-with-symbol-table">
                      <input
                        type="number"
                        value={row.r}
                        onChange={(e) => handleChange(rowIndex, 'r', e.target.value)}
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        className="table-input"
                      />
                      <span className="input-symbol-table">%</span>
                    </div>
                    {errors[rowIndex]?.r && <div className="error-inline">{errors[rowIndex].r}</div>}
                  </td>
                  <td>
                    <div className="input-with-symbol-table">
                      <input
                        type="number"
                        value={row.d}
                        onChange={(e) => handleChange(rowIndex, 'd', e.target.value)}
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        className="table-input"
                      />
                      <span className="input-symbol-table">%</span>
                    </div>
                    {errors[rowIndex]?.d && <div className="error-inline">{errors[rowIndex].d}</div>}
                  </td>
                  <td>
                    <div className="input-with-symbol-table">
                      <input
                        type="number"
                        value={row.v}
                        onChange={(e) => handleChange(rowIndex, 'v', e.target.value)}
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        className="table-input"
                      />
                      <span className="input-symbol-table">%</span>
                    </div>
                    {errors[rowIndex]?.v && <div className="error-inline">{errors[rowIndex].v}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button type="button" onClick={addRow} className="add-row-btn">
            + Add Row
          </button>
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Calculating...' : `Calculate ${rows.length} Option${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </>
  );
};
