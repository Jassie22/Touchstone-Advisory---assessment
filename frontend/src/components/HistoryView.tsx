import React, { useEffect, useState } from 'react';
import { CalculationSummary } from '../types';
import { getCalculationHistory } from '../services/api';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<CalculationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCalculationHistory();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return value.toFixed(4);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="history-loading">Loading history...</div>;
  }

  if (error) {
    return (
      <div className="history-error">
        <p>Error: {error}</p>
        <button onClick={loadHistory}>Retry</button>
      </div>
    );
  }

  if (history.length === 0) {
    return <div className="history-empty">No calculation history available.</div>;
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <h2>Calculation History</h2>
        <button onClick={loadHistory} className="refresh-button">Refresh</button>
      </div>
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>S<sub>0</sub></th>
              <th>X</th>
              <th>t (years)</th>
              <th>r</th>
              <th>d</th>
              <th>v</th>
              <th>Call Price</th>
              <th>Put Price</th>
            </tr>
          </thead>
          <tbody>
            {history.map((calc) => (
              <tr key={calc.id}>
                <td>{formatDate(calc.created_at)}</td>
                <td>${formatCurrency(calc.s0)}</td>
                <td>${formatCurrency(calc.x)}</td>
                <td>{calc.t.toFixed(2)}</td>
                <td>{(calc.r * 100).toFixed(2)}%</td>
                <td>{(calc.d * 100).toFixed(2)}%</td>
                <td>{(calc.v * 100).toFixed(2)}%</td>
                <td className="price-cell">${formatCurrency(calc.call_price)}</td>
                <td className="price-cell">${formatCurrency(calc.put_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
