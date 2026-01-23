import React, { useEffect, useState } from 'react';
import { CalculationSummary } from '../types';
import { getCalculationHistory } from '../services/api';

type ColumnKey = 'date' | 's0' | 'x' | 't' | 'r' | 'd' | 'v' | 'call_price' | 'put_price';
type ExportFormat = 'csv' | 'sql' | 'json';

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

  const getSelectedColumns = () => columns.filter(col => col.selected);

  const formatValue = (calc: CalculationSummary, key: ColumnKey): string => {
    switch (key) {
      case 'date':
        return formatDate(calc.created_at);
      case 's0':
        return formatCurrency(calc.s0);
      case 'x':
        return formatCurrency(calc.x);
      case 't':
        return calc.t.toFixed(2);
      case 'r':
        return (calc.r * 100).toFixed(2);
      case 'd':
        return (calc.d * 100).toFixed(2);
      case 'v':
        return (calc.v * 100).toFixed(2);
      case 'call_price':
        return formatCurrency(calc.call_price);
      case 'put_price':
        return formatCurrency(calc.put_price);
      default:
        return '';
    }
  };

  const generateCSV = (): string => {
    const selectedCols = getSelectedColumns();
    if (selectedCols.length === 0) return '';

    const headers = selectedCols.map(col => col.label);
    const csvRows = [headers.join(',')];

    history.forEach(calc => {
      const row = selectedCols.map(col => {
        const value = formatValue(calc, col.key);
        return col.key === 'date' ? `"${value}"` : value;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const generateSQL = (): string => {
    const selectedCols = getSelectedColumns();
    if (selectedCols.length === 0) return '';

    const columnNames = selectedCols.map(col => {
      const sqlName = col.key === 'date' ? 'created_at' : 
                     col.key === 's0' ? 's0' :
                     col.key === 'x' ? 'x' :
                     col.key === 't' ? 't' :
                     col.key === 'r' ? 'r' :
                     col.key === 'd' ? 'd' :
                     col.key === 'v' ? 'v' :
                     col.key === 'call_price' ? 'call_price' :
                     'put_price';
      return sqlName;
    }).join(', ');

    let sql = `INSERT INTO calculations (${columnNames}) VALUES\n`;
    const values = history.map((calc, idx) => {
      const rowValues = selectedCols.map(col => {
        const value = formatValue(calc, col.key);
        if (col.key === 'date') {
          return `'${new Date(calc.created_at).toISOString()}'`;
        }
        return value;
      }).join(', ');
      return `  (${rowValues})${idx < history.length - 1 ? ',' : ';'}`;
    });

    return sql + values.join('\n');
  };

  const generateJSON = (): string => {
    const selectedCols = getSelectedColumns();
    if (selectedCols.length === 0) return '';

    const data = history.map(calc => {
      const obj: any = {};
      selectedCols.forEach(col => {
        const value = formatValue(calc, col.key);
        obj[col.label] = col.key === 'date' ? value : 
                        (col.key === 't' ? parseFloat(value) :
                        (col.key === 'r' || col.key === 'd' || col.key === 'v' ? parseFloat(value) :
                        parseFloat(value)));
      });
      return obj;
    });

    return JSON.stringify(data, null, 2);
  };

  const copyToClipboard = (content: string, format: string) => {
    navigator.clipboard.writeText(content).then(() => {
      alert(`${format.toUpperCase()} copied to clipboard!`);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (format: ExportFormat, action: 'download' | 'copy') => {
    const selectedCols = getSelectedColumns();
    if (selectedCols.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'csv':
        content = generateCSV();
        filename = `black-scholes-history-${timestamp}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'sql':
        content = generateSQL();
        filename = `black-scholes-history-${timestamp}.sql`;
        mimeType = 'text/sql;charset=utf-8;';
        break;
      case 'json':
        content = generateJSON();
        filename = `black-scholes-history-${timestamp}.json`;
        mimeType = 'application/json;charset=utf-8;';
        break;
    }

    if (action === 'copy') {
      copyToClipboard(content, format);
    } else {
      downloadFile(content, filename, mimeType);
      setShowExportModal(false);
    }
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
            Export Data
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
              <h3>Export Data</h3>
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

              <div className="export-format-section">
                <h4>Export Format:</h4>
                <div className="export-format-options">
                  <div className="format-group">
                    <h5>CSV</h5>
                    <div className="format-actions">
                      <button onClick={() => handleExport('csv', 'download')} className="format-button">
                        Download CSV
                      </button>
                      <button onClick={() => handleExport('csv', 'copy')} className="format-button copy-button">
                        Copy CSV
                      </button>
                    </div>
                  </div>
                  <div className="format-group">
                    <h5>SQL</h5>
                    <div className="format-actions">
                      <button onClick={() => handleExport('sql', 'download')} className="format-button">
                        Download SQL
                      </button>
                      <button onClick={() => handleExport('sql', 'copy')} className="format-button copy-button">
                        Copy SQL
                      </button>
                    </div>
                  </div>
                  <div className="format-group">
                    <h5>JSON</h5>
                    <div className="format-actions">
                      <button onClick={() => handleExport('json', 'download')} className="format-button">
                        Download JSON
                      </button>
                      <button onClick={() => handleExport('json', 'copy')} className="format-button copy-button">
                        Copy JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowExportModal(false)} className="cancel-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
