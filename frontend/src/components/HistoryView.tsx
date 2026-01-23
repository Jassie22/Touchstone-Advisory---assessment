import React, { useEffect, useState } from 'react';
import { CalculationSummary } from '../types';
import { getCalculationHistory } from '../services/api';

type ColumnKey = 'date' | 's0' | 'x' | 't' | 'r' | 'd' | 'v' | 'call_price' | 'put_price';

interface ColumnOption {
  key: ColumnKey;
  label: string;
  selected: boolean;
}

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<CalculationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [columns, setColumns] = useState<ColumnOption[]>([
    { key: 'date', label: 'Date', selected: true },
    { key: 's0', label: 'S₀', selected: true },
    { key: 'x', label: 'X', selected: true },
    { key: 't', label: 't (years)', selected: true },
    { key: 'r', label: 'r (%)', selected: true },
    { key: 'd', label: 'd (%)', selected: true },
    { key: 'v', label: 'v (%)', selected: true },
    { key: 'call_price', label: 'Call Price', selected: true },
    { key: 'put_price', label: 'Put Price', selected: true },
  ]);

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

  const toggleColumn = (key: ColumnKey) => {
    setColumns(columns.map(col => 
      col.key === key ? { ...col, selected: !col.selected } : col
    ));
  };

  const selectAllColumns = () => {
    setColumns(columns.map(col => ({ ...col, selected: true })));
  };

  const deselectAllColumns = () => {
    setColumns(columns.map(col => ({ ...col, selected: false })));
  };

  const exportToCSV = () => {
    const selectedCols = columns.filter(col => col.selected);
    if (selectedCols.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    // Create CSV header
    const headers = selectedCols.map(col => col.label);
    const csvRows = [headers.join(',')];

    // Add data rows
    history.forEach(calc => {
      const row: string[] = [];
      selectedCols.forEach(col => {
        let value: string;
        switch (col.key) {
          case 'date':
            value = `"${formatDate(calc.created_at)}"`;
            break;
          case 's0':
            value = formatCurrency(calc.s0);
            break;
          case 'x':
            value = formatCurrency(calc.x);
            break;
          case 't':
            value = calc.t.toFixed(2);
            break;
          case 'r':
            value = (calc.r * 100).toFixed(2);
            break;
          case 'd':
            value = (calc.d * 100).toFixed(2);
            break;
          case 'v':
            value = (calc.v * 100).toFixed(2);
            break;
          case 'call_price':
            value = formatCurrency(calc.call_price);
            break;
          case 'put_price':
            value = formatCurrency(calc.put_price);
            break;
          default:
            value = '';
        }
        row.push(value);
      });
      csvRows.push(row.join(','));
    });

    // Create and download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `black-scholes-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
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
        <div className="history-actions">
          <button onClick={() => setShowExportModal(true)} className="export-button">
            Export CSV
          </button>
          <button onClick={loadHistory} className="refresh-button">Refresh</button>
        </div>
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

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export to CSV</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <p>Select columns to export:</p>
              <div className="export-column-actions">
                <button type="button" onClick={selectAllColumns} className="select-all-button">
                  Select All
                </button>
                <button type="button" onClick={deselectAllColumns} className="deselect-all-button">
                  Deselect All
                </button>
              </div>
              <div className="export-columns">
                {columns.map((col) => (
                  <label key={col.key} className="export-column-checkbox">
                    <input
                      type="checkbox"
                      checked={col.selected}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowExportModal(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={exportToCSV} className="export-confirm-button">
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
