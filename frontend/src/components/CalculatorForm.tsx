import React, { useState, FormEvent } from 'react';
import { CalculationInput } from '../types';

interface CalculatorFormProps {
  onSubmit: (input: CalculationInput) => void;
  isLoading?: boolean;
}

type RateInputMode = 'percent' | 'decimal';

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  // Store values in the units the user types (percent by default for rates)
  const [formData, setFormData] = useState<CalculationInput>({
    s0: 100,
    x: 100,
    t: 1,
    r: 5 as unknown as number,
    d: 2 as unknown as number,
    v: 20 as unknown as number,
  });

  const [rateMode, setRateMode] = useState<RateInputMode>('percent');
  const [errors, setErrors] = useState<
    Partial<Record<keyof CalculationInput, string>>
  >({});

  const validateField = (
    name: keyof CalculationInput,
    value: number
  ): string | undefined => {
    if (value === ('' as unknown as number) || value === (NaN as unknown as number)) {
      return `${name} is required`;
    }
    if (isNaN(value)) {
      return `${name} must be a number`;
    }

    if (name === 's0' || name === 'x' || name === 't') {
      if (value <= 0) {
        return `${name} must be greater than 0`;
      }
    }

    if (name === 'r' || name === 'd' || name === 'v') {
      if (rateMode === 'percent') {
        if (value < 0 || value > 100) {
          return `${name} should be between 0 and 100 when entered as a percentage`;
        }
      } else if (value < 0) {
        return `${name} must be non-negative`;
      }
    }

    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue =
      value === '' ? ('' as unknown as number) : parseFloat(value);

    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));

    if (errors[name as keyof CalculationInput]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof CalculationInput];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<Record<keyof CalculationInput, string>> = {};
    let hasErrors = false;

    (Object.keys(formData) as Array<keyof CalculationInput>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    const toDecimal = (value: number) =>
      rateMode === 'percent' ? value / 100 : value;

    const payload: CalculationInput = {
      ...formData,
      r: toDecimal(formData.r),
      d: toDecimal(formData.d),
      v: toDecimal(formData.v),
    };

    onSubmit(payload);
  };

  const renderRateLabelSuffix = () =>
    rateMode === 'percent'
      ? '(% input, e.g., 5 for 5%)'
      : '(decimal, e.g., 0.05 for 5%)';

  return (
    <>
      <form onSubmit={handleSubmit} className="calculator-form">
        <div className="form-header-row">
          <div>
            <h2 className="panel-title">Input parameters</h2>
            <p className="panel-subtitle">
              Enter market assumptions below. Rates and volatility can be
              entered as percentages or decimals.
            </p>
          </div>
          <div className="rate-mode-toggle" aria-label="Rate input mode">
            <span>Rate input:</span>
            <button
              type="button"
              className={
                rateMode === 'percent' ? 'toggle-option active' : 'toggle-option'
              }
              onClick={() => setRateMode('percent')}
            >
              Percent (%)
            </button>
            <button
              type="button"
              className={
                rateMode === 'decimal' ? 'toggle-option active' : 'toggle-option'
              }
              onClick={() => setRateMode('decimal')}
            >
              Decimal
            </button>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="s0">
              Current Stock Price (S<sub>0</sub>)
            </label>
            <input
              type="number"
              id="s0"
              name="s0"
              value={formData.s0}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
            />
            <span className="field-helper">
              Current underlying share price
            </span>
            {errors.s0 && <span className="error">{errors.s0}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="x">Strike Price (X)</label>
            <input
              type="number"
              id="x"
              name="x"
              value={formData.x}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
            />
            <span className="field-helper">Exercise price of the option</span>
            {errors.x && <span className="error">{errors.x}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="t">Time to Maturity (t, in years)</label>
            <input
              type="number"
              id="t"
              name="t"
              value={formData.t}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
            />
            <span className="field-helper">
              For example, 0.5 = 6 months, 1 = 1 year
            </span>
            {errors.t && <span className="error">{errors.t}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="r">
              Risk-Free Interest Rate r {renderRateLabelSuffix()}
            </label>
            <input
              type="number"
              id="r"
              name="r"
              value={formData.r}
              onChange={handleChange}
              step="0.01"
              required
            />
            <span className="field-helper">
              Typically government bond yield at the relevant tenor
            </span>
            {errors.r && <span className="error">{errors.r}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="d">
              Dividend Yield d {renderRateLabelSuffix()}
            </label>
            <input
              type="number"
              id="d"
              name="d"
              value={formData.d}
              onChange={handleChange}
              step="0.01"
              required
            />
            <span className="field-helper">
              Forward-looking annual dividend yield
            </span>
            {errors.d && <span className="error">{errors.d}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="v">
              Volatility v {renderRateLabelSuffix()}
            </label>
            <input
              type="number"
              id="v"
              name="v"
              value={formData.v}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
            <span className="field-helper">
              Annualised volatility of the underlying share price
            </span>
            {errors.v && <span className="error">{errors.v}</span>}
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Calculating...' : 'Calculate Black-Scholes Prices'}
        </button>
      </form>

      <section className="inputs-info-panel">
        <h3>Parameter definitions</h3>
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
            <strong>r</strong> – Continuously compounded risk-free rate.
          </li>
          <li>
            <strong>d</strong> – Continuous dividend yield on the underlying.
          </li>
          <li>
            <strong>v</strong> – Annualised volatility of the underlying
            return.
          </li>
        </ul>
        <p className="inputs-info-note">
          Rates and volatility are converted to decimals internally, so you can
          work in whichever convention is most natural (5% or 0.05).
        </p>
      </section>
    </>
  );
};
