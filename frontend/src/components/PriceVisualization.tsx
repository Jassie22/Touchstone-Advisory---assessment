import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCalculationHistory } from '../services/api';
import { CalculationSummary } from '../types';

export const PriceVisualization: React.FC = () => {
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const chartData = history
    .slice()
    .reverse()
    .map((calc, index) => ({
      index: index + 1,
      timestamp: new Date(calc.created_at).getTime(),
      time: formatDate(calc.created_at),
      callPrice: parseFloat(calc.call_price.toFixed(4)),
      putPrice: parseFloat(calc.put_price.toFixed(4)),
      stockPrice: calc.s0,
      strikePrice: calc.x,
      timeToMaturity: calc.t,
      volatility: calc.v,
      interestRate: calc.r,
      dividendYield: calc.d,
    }));

  if (loading) {
    return <div className="visualization-loading">Loading visualization data...</div>;
  }

  if (error) {
    return (
      <div className="visualization-error">
        <p>Error: {error}</p>
        <button onClick={loadHistory}>Retry</button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="visualization-empty">
        <p>No calculation history available for visualization.</p>
        <p>Perform some calculations first to see price trends over time.</p>
      </div>
    );
  }

  return (
    <div className="price-visualization">
      <div className="visualization-header">
        <h2>Option Prices Over Time</h2>
        <button onClick={loadHistory} className="refresh-button">
          Refresh
        </button>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`$${value.toFixed(4)}`, name]}
              labelFormatter={(label: number) => {
                const dataPoint = chartData.find(d => d.timestamp === label);
                if (dataPoint) {
                  return (
                    <div>
                      <div><strong>{dataPoint.time}</strong></div>
                      <div style={{ fontSize: '0.85em', marginTop: '4px', color: '#666' }}>
                        S₀: ${dataPoint.stockPrice.toFixed(2)} | X: ${dataPoint.strikePrice.toFixed(2)} | t: {dataPoint.timeToMaturity.toFixed(2)}y
                        <br />
                        r: {(dataPoint.interestRate * 100).toFixed(2)}% | d: {(dataPoint.dividendYield * 100).toFixed(2)}% | v: {(dataPoint.volatility * 100).toFixed(2)}%
                      </div>
                    </div>
                  );
                }
                return `Time: ${new Date(label).toLocaleString()}`;
              }}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="callPrice"
              stroke="#667eea"
              strokeWidth={2}
              name="Call Price"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="putPrice"
              stroke="#f5576c"
              strokeWidth={2}
              name="Put Price"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {history.length > 0 && (
        <div className="visualization-note">
          <p>
            <strong>Tip:</strong> This chart shows option prices over time. For more interesting trends, try calculating options with different parameters 
            (e.g., varying stock prices, volatility, or time to maturity). Hover over data points to see the input parameters.
          </p>
        </div>
      )}

      <div className="visualization-stats">
        <div className="stat-card">
          <h4>Total Calculations</h4>
          <p className="stat-value">{history.length}</p>
        </div>
        <div className="stat-card">
          <h4>Avg Call Price</h4>
          <p className="stat-value">
            $
            {(
              history.reduce((sum, calc) => sum + calc.call_price, 0) / history.length
            ).toFixed(4)}
          </p>
        </div>
        <div className="stat-card">
          <h4>Avg Put Price</h4>
          <p className="stat-value">
            $
            {(
              history.reduce((sum, calc) => sum + calc.put_price, 0) / history.length
            ).toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
};
