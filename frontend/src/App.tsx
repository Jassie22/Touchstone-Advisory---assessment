import React, { useState } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HistoryView } from './components/HistoryView';
import { CalculationInput, CalculationResult, BatchCalculationResponse } from './types';
import { calculateBlackScholes } from './services/api';
import './App.css';

function App() {
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');

  const handleCalculate = async (input: CalculationInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await calculateBlackScholes(input);
      setCurrentResult(result);
      setActiveTab('calculator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate Black-Scholes prices');
      setCurrentResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchResults = (results: BatchCalculationResponse) => {
    // For batch results, show the first result or handle differently
    if (results.results.length > 0) {
      setCurrentResult(results.results[0]);
    }
    alert(`Batch calculation complete: ${results.successful} successful, ${results.failed} failed`);
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
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'calculator' && (
          <div className="calculator-tab">
            <CalculatorForm onSubmit={handleCalculate} onBatchResults={handleBatchResults} isLoading={isLoading} />
            {error && <div className="error-message">{error}</div>}
            <ResultsDisplay result={currentResult} />
            <div className="info-panels-container">
              <section className="inputs-info-panel">
                <h3>Parameter Definitions</h3>
                <ul>
                  <li>
                    <strong>S₀</strong> – Current share price of the underlying.
                  </li>
                  <li>
                    <strong>X</strong> – Strike (exercise) price of the option.
                  </li>
                  <li>
                    <strong>t</strong> – Time to maturity in years (e.g., 3 months ≈
                    0.25).
                  </li>
                  <li>
                    <strong>r</strong> – Continuously compounded risk-free rate (as %).
                  </li>
                  <li>
                    <strong>d</strong> – Continuous dividend yield on the underlying (as %).
                  </li>
                  <li>
                    <strong>v</strong> – Annualised volatility of the underlying
                    return (as %).
                  </li>
                  <li>
                    <strong>N(x)</strong> – Cumulative standard normal distribution function.
                  </li>
                </ul>
              </section>

              <section className="formula-panel">
                <h3>Black-Scholes Formula</h3>
                <div className="formula-content">
                  <div className="formula-section">
                    <h4>Call Option:</h4>
                    <div className="formula">
                      C = S₀e<sup>-dt</sup>N(d₁) - Xe<sup>-rt</sup>N(d₂)
                    </div>
                  </div>
                  <div className="formula-section">
                    <h4>Put Option:</h4>
                    <div className="formula">
                      P = Xe<sup>-rt</sup>N(-d₂) - S₀e<sup>-dt</sup>N(-d₁)
                    </div>
                  </div>
                  <div className="formula-section">
                    <h4>Where:</h4>
                    <div className="formula-intermediates">
                      <div>d₁ = [ln(S₀/X) + (r - d + ½v²)t] / (v√t)</div>
                      <div>d₂ = d₁ - v√t</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'history' && <HistoryView />}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a 
              href="mailto:jasmeendahak03@gmail.com" 
              className="footer-link"
              aria-label="Email"
            >
              <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>jasmeendahak03@gmail.com</span>
            </a>
            <a 
              href="https://www.linkedin.com/in/jasmeendahak/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="LinkedIn"
            >
              <svg className="footer-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
