import React, { useState } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HistoryView } from './components/HistoryView';
import { BatchCalculator } from './components/BatchCalculator';
import { CalculationInput, CalculationResult } from './types';
import { calculateBlackScholes } from './services/api';
import './App.css';

function App() {
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calculator' | 'batch' | 'history'>('calculator');

  const handleCalculate = async (input: CalculationInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await calculateBlackScholes(input);
      setCurrentResult(result);
      // Switch to calculator tab to show results
      setActiveTab('calculator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate Black-Scholes prices');
      setCurrentResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Black-Scholes Options Pricing Calculator</h1>
        <p className="subtitle">Calculate European option prices using the Black-Scholes model</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          Calculator
        </button>
        <button
          className={`tab-button ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          Batch
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'calculator' && (
          <div className="calculator-tab">
            <CalculatorForm onSubmit={handleCalculate} isLoading={isLoading} />
            {error && <div className="error-message">{error}</div>}
            <ResultsDisplay result={currentResult} />
          </div>
        )}

        {activeTab === 'batch' && <BatchCalculator />}

        {activeTab === 'history' && <HistoryView />}
      </main>

      <footer className="app-footer">
        <p>Assumptions: European-style options, continuous compounding, constant volatility and interest rates</p>
      </footer>
    </div>
  );
}

export default App;
