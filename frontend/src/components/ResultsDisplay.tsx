import React from 'react';
import { CalculationResult } from '../types';

interface ResultsDisplayProps {
  result: CalculationResult | null;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  const formatCurrency = (value: number): string => {
    return value.toFixed(4);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="results-display">
      <h2>Calculation Results</h2>
      <div className="results-grid">
        <div className="result-card call-price">
          <h3>Call Option Price</h3>
          <p className="price-value">${formatCurrency(result.call_price)}</p>
        </div>
        <div className="result-card put-price">
          <h3>Put Option Price</h3>
          <p className="price-value">${formatCurrency(result.put_price)}</p>
        </div>
      </div>
      
      <div className="intermediate-values">
        <h3>Intermediate Values</h3>
        <div className="values-grid">
          <div className="value-item">
            <span className="value-label">d<sub>1</sub>:</span>
            <span className="value-number">{result.d1.toFixed(6)}</span>
          </div>
          <div className="value-item">
            <span className="value-label">d<sub>2</sub>:</span>
            <span className="value-number">{result.d2.toFixed(6)}</span>
          </div>
        </div>
      </div>

      <div className="calculation-info">
        <p><strong>Calculated at:</strong> {formatDate(result.created_at)}</p>
      </div>
    </div>
  );
};
