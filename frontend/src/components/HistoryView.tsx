import React, { useEffect, useState } from 'react';
import { CalculationSummary } from '../types';
import { getCalculationHistory } from '../services/api';
import { deleteHistoryEntries } from '../services/api';

type ExportFormat = 'csv' | 'sql' | 'json';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<CalculationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    // Clear selections when page changes
    setSelectedRows(new Set());
  }, [currentPage, itemsPerPage]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const skip = (currentPage - 1) * itemsPerPage;
      const data = await getCalculationHistory(skip, itemsPerPage);
      setHistory(data);
      const count = await getHistoryCount();
      setTotalCount(count.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getHistoryCount = async (): Promise<{ total: number }> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/history/count`);
    return response.json();
  };

  const formatCurrency = (value: number): string => {
    return value.toFixed(4);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatValue = (calc: CalculationSummary, key: string): string => {
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

  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllRows = () => {
    setSelectedRows(new Set(history.map(calc => calc.id)));
  };

  const deselectAllRows = () => {
    setSelectedRows(new Set());
  };

  const getSelectedCalculations = (): CalculationSummary[] => {
    return history.filter(calc => selectedRows.has(calc.id));
  };

  const generateCSV = (calculations: CalculationSummary[]): string => {
    const headers = ['Date', 'S₀', 'X', 't (years)', 'r (%)', 'd (%)', 'v (%)', 'Call Price', 'Put Price'];
    const csvRows = [headers.join(',')];

    calculations.forEach(calc => {
      const row = [
        `"${formatValue(calc, 'date')}"`,
        formatValue(calc, 's0'),
        formatValue(calc, 'x'),
        formatValue(calc, 't'),
        formatValue(calc, 'r'),
        formatValue(calc, 'd'),
        formatValue(calc, 'v'),
        formatValue(calc, 'call_price'),
        formatValue(calc, 'put_price'),
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const generateSQL = (calculations: CalculationSummary[]): string => {
    let sql = `INSERT INTO calculations (s0, x, t, r, d, v, call_price, put_price, created_at) VALUES\n`;
    const values = calculations.map((calc, idx) => {
      const rowValues = [
        formatValue(calc, 's0'),
        formatValue(calc, 'x'),
        formatValue(calc, 't'),
        (calc.r).toFixed(6),
        (calc.d).toFixed(6),
        (calc.v).toFixed(6),
        formatValue(calc, 'call_price'),
        formatValue(calc, 'put_price'),
        `'${new Date(calc.created_at).toISOString()}'`,
      ].join(', ');
      return `  (${rowValues})${idx < calculations.length - 1 ? ',' : ';'}`;
    });

    return sql + values.join('\n');
  };

  const generateJSON = (calculations: CalculationSummary[]): string => {
    const data = calculations.map(calc => ({
      'Date': formatValue(calc, 'date'),
      'S₀': parseFloat(formatValue(calc, 's0')),
      'X': parseFloat(formatValue(calc, 'x')),
      't (years)': parseFloat(formatValue(calc, 't')),
      'r (%)': parseFloat(formatValue(calc, 'r')),
      'd (%)': parseFloat(formatValue(calc, 'd')),
      'v (%)': parseFloat(formatValue(calc, 'v')),
      'Call Price': parseFloat(formatValue(calc, 'call_price')),
      'Put Price': parseFloat(formatValue(calc, 'put_price')),
    }));

    return JSON.stringify(data, null, 2);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastType(type);
    setToastMessage(message);
    // Auto-hide after a short delay
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const copyToClipboard = (content: string, format: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        showToast(`${format.toUpperCase()} copied to clipboard!`, 'success');
        setShowCopyDropdown(false);
      })
      .catch(() => {
        showToast('Failed to copy to clipboard', 'error');
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
    setShowExportDropdown(false);
  };

  const handleCopy = (format: ExportFormat) => {
    const calculations = getSelectedCalculations();
    if (calculations.length === 0) {
      showToast('Please select at least one row to copy.', 'error');
      return;
    }

    let content = '';
    switch (format) {
      case 'csv':
        content = generateCSV(calculations);
        break;
      case 'sql':
        content = generateSQL(calculations);
        break;
      case 'json':
        content = generateJSON(calculations);
        break;
    }
    copyToClipboard(content, format);
  };

  const handleExport = (format: ExportFormat) => {
    const calculations = getSelectedCalculations();
    if (calculations.length === 0) {
      showToast('Please select at least one row to export.', 'error');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'csv':
        content = generateCSV(calculations);
        filename = `black-scholes-history-${timestamp}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'sql':
        content = generateSQL(calculations);
        filename = `black-scholes-history-${timestamp}.sql`;
        mimeType = 'text/sql;charset=utf-8;';
        break;
      case 'json':
        content = generateJSON(calculations);
        filename = `black-scholes-history-${timestamp}.json`;
        mimeType = 'application/json;charset=utf-8;';
        break;
    }

    downloadFile(content, filename, mimeType);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const allSelected = history.length > 0 && selectedRows.size === history.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < history.length;

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) {
      showToast('Please select at least one row to delete.', 'error');
      return;
    }

    const idsToDelete = Array.from(selectedRows);
    try {
      await deleteHistoryEntries(idsToDelete);
      showToast(`Deleted ${idsToDelete.length} entr${idsToDelete.length === 1 ? 'y' : 'ies'} from history.`, 'success');
      await loadHistory();
      setSelectedRows(new Set());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete selected history rows.', 'error');
    }
  };

  return (
    <>
      {toastMessage && (
        <div className={`toast-notification ${toastType === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toastMessage}
        </div>
      )}
      {loading && history.length === 0 && (
        <div className="history-loading">Loading history...</div>
      )}
      {error && (
        <div className="history-error">
          <p>Error: {error}</p>
          <button onClick={loadHistory}>Retry</button>
        </div>
      )}
      {!loading && !error && history.length === 0 && (
        <div className="history-empty">No calculation history available.</div>
      )}
      {history.length > 0 && (
        <div className="history-view">
          <div className="history-header">
            <div>
              <h2>Calculation History</h2>
              <p className="history-subtitle">View and export your previous Black-Scholes calculations</p>
            </div>
            <div className="history-actions">
              <div className="dropdown-container">
                <button
                  onClick={() => { setShowCopyDropdown(!showCopyDropdown); setShowExportDropdown(false); }}
                  className="copy-button"
                >
                  Copy ↓
                </button>
                {showCopyDropdown && (
                  <div className="dropdown-menu">
                    <button onClick={() => handleCopy('csv')}>Copy as CSV</button>
                    <button onClick={() => handleCopy('sql')}>Copy as SQL</button>
                    <button onClick={() => handleCopy('json')}>Copy as JSON</button>
                  </div>
                )}
              </div>
              <div className="dropdown-container">
                <button
                  onClick={() => { setShowExportDropdown(!showExportDropdown); setShowCopyDropdown(false); }}
                  className="export-button"
                >
                  Export ↓
                </button>
                {showExportDropdown && (
                  <div className="dropdown-menu">
                    <button onClick={() => handleExport('csv')}>Export as CSV</button>
                    <button onClick={() => handleExport('sql')}>Export as SQL</button>
                    <button onClick={() => handleExport('json')}>Export as JSON</button>
                  </div>
                )}
              </div>
              <button onClick={loadHistory} className="refresh-button">Refresh</button>
            </div>
          </div>

          <div className="history-selection-controls">
            <div className="selection-actions">
              <button
                type="button"
                onClick={allSelected ? deselectAllRows : selectAllRows}
                className="select-all-button"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="delete-selected-button"
              >
                Delete Selected
              </button>
              <span className="selection-info">
                {selectedRows.size > 0
                  ? `${selectedRows.size} of ${history.length} selected`
                  : 'No rows selected'}
              </span>
            </div>
            <div className="pagination-info-top">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </div>
          </div>

          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
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
                  <tr key={calc.id} className={selectedRows.has(calc.id) ? 'selected' : ''}>
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(calc.id)}
                        onChange={() => toggleRowSelection(calc.id)}
                        className="row-checkbox"
                      />
                    </td>
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

          <div className="history-footer-controls">
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
            <div className="items-per-page-bottom">
              <label>Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="page-size-select"
              >
                <option value={10}>10</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
