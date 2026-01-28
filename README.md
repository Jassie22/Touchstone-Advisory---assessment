# Black-Scholes Options Pricing Calculator

A full-stack single-page application (SPA) for calculating European option prices using the Black-Scholes model. The application includes a React/TypeScript frontend, a Python/FastAPI backend, and SQLite database for storing calculation history.

## Project Description

This application allows users to:
- Calculate call and put option prices using the Black-Scholes formula
- View a history of previous calculations
- Input all required parameters (stock price, strike price, time to maturity, risk-free rate, dividend yield, and volatility)

The Black-Scholes model is a mathematical framework for pricing European-style options, widely used in financial valuations for option pricing, risk management, and stock-based compensation valuation.

## Project Structure

```
black-scholes-calculator/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # Database connection
│   │   ├── black_scholes.py # Calculation logic
│   │   └── routers/
│   │       └── calculations.py # API endpoints
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript types
│   │   └── __tests__/      # Frontend tests
│   └── package.json        # Node.js dependencies
└── README.md               # This file
```

## Prerequisites

- Python 3.8 or higher (Python 3.11 or 3.12 recommended for best compatibility)
- Node.js 16 or higher and npm
- Git

## Quick Start

### 1. Install Dependencies

**Windows (PowerShell, recommended):**
```powershell
cd black-scholes-calculator
powershell -ExecutionPolicy Bypass -File .\install_dependencies.ps1
```

This script automatically installs:
- **Backend** dependencies from `backend/requirements.txt`
- **Frontend** dependencies via `npm install` in `frontend/`

If you prefer to install manually:
```bash
# Backend
cd backend
python -m pip install --upgrade pip setuptools wheel
python -m pip install --prefer-binary -r requirements.txt

# Frontend
cd ../frontend
npm install
```

> **Python note (Windows):** If you have multiple Python versions and see issues with Python 3.14+, run commands with `py -3.11` instead of `python` (e.g. `py -3.11 -m pip install -r requirements.txt`).

### 2. Start the Backend API

Open **Terminal 1**:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
On Windows with multiple Python versions you can use:
```bash
cd backend
py -3.11 -m uvicorn app.main:app --reload --port 8000
```

- API base URL: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Generate Sample Data (Optional but recommended)

To pre-populate the database with **100 random sample calculations**:

```bash
cd backend
python add_sample_data.py
# or, if needed:
py -3.11 add_sample_data.py
```

This creates/updates `backend/calculations.db` so the **History** tab is populated immediately.

### 4. Start the Frontend UI

Open **Terminal 2**:
```bash
cd frontend
npm start
```

- Frontend UI: `http://localhost:3000`
- Make sure the backend from Step 2 is running first.

### Troubleshooting

- **Python 3.14+ compatibility:** If `scipy` installation fails, use Python 3.11 or 3.12, or try: `python -m pip install scipy --only-binary :all:`
- **Virtual environment (recommended):** Create one with `python -m venv venv` and activate it before installing dependencies

## Usage

1. **Calculator tab (single and batch in one view):**
   - Enter parameters in the table:
     - **S₀** – Current stock price (must be > 0)
     - **X** – Strike price (must be > 0)
     - **t** – Time to maturity in years (e.g. 3 months ≈ 0.25; must be > 0)
     - **r (%)** – Risk-free rate (entered as a **percentage**, e.g. `5` for 5%)
     - **d (%)** – Dividend yield (percentage)
     - **v (%)** – Volatility (percentage)
   - Use **“+ Add Row”** to add additional scenarios; all rows are submitted together.
   - For a **single row**, the backend performs a standard calculation and the **Results** panel shows:
     - Call and put prices
     - Intermediate values d₁ and d₂
     - Input summary and timestamp
   - For **multiple rows**, the form uses the batch API under the hood and shows a summary of successes/failures.

2. **Context panels (below the calculator):**
   - **Parameter Definitions**: explains each of S₀, X, t, r, d, v and N(x), with notes on units and typical usage.
   - **Black‑Scholes Formula**: shows the closed-form call/put formulas plus the definitions of d₁ and d₂ for quick reference.

3. **History tab:**
   - Shows a paginated table of previous calculations (including seeded sample data if you ran `add_sample_data.py`):
     - Inputs (S₀, X, t, r, d, v) and resulting call/put prices.
   - Features:
     - **Row selection** with “Select All / Deselect All”
     - **Items per page**: 10, 100, or 500 rows
     - **Copy** selected (or all) rows to clipboard as **CSV, SQL, or JSON**
     - **Export** selected (or all) rows as downloadable **CSV, SQL, or JSON** files
     - **Refresh** button to re-query the backend.

## Challenge Requirements Checklist

- **React + TypeScript frontend** for input, results, and history views.
- **FastAPI + Python backend** implementing the Black‑Scholes formula including dividend yield.
- **SQLite database** for persisting calculation history.
- **API layer** to calculate prices (single and batch) and retrieve history with pagination.
- **Tests**:
  - Backend: unit tests for pricing logic, API tests, and model tests.
  - Frontend: tests for core components and API client.
- **GitHub repository** with clear documentation and setup instructions.
- **User-friendly UI** with percentage-based inputs, integrated batch calculator, parameter definitions, and in‑context formulas.

## API Endpoints

### `POST /api/calculate`
Calculate Black-Scholes option prices.

**Request Body:**
```json
{
  "s0": 100.0,
  "x": 100.0,
  "t": 1.0,
  "r": 0.05,
  "d": 0.02,
  "v": 0.2
}
```

**Response:**
```json
{
  "id": 1,
  "s0": 100.0,
  "x": 100.0,
  "t": 1.0,
  "r": 0.05,
  "d": 0.02,
  "v": 0.2,
  "call_price": 10.45,
  "put_price": 5.23,
  "d1": 0.25,
  "d2": 0.05,
  "created_at": "2026-01-23T12:00:00Z"
}
```

### `GET /api/history`
Get all calculation history (summary format, excludes d1/d2).

**Response:** Array of calculation summaries

### `GET /api/history/{id}`
Get a specific calculation by ID (includes d1/d2 intermediate values).

**Response:** Full calculation details (same format as POST response)

### `POST /api/calculate/batch`
Calculate Black-Scholes prices for multiple parameter sets at once.

**Request Body:**
```json
{
  "calculations": [
    { "s0": 100.0, "x": 100.0, "t": 1.0, "r": 0.05, "d": 0.02, "v": 0.2 },
    { "s0": 110.0, "x": 100.0, "t": 0.5, "r": 0.03, "d": 0.01, "v": 0.25 }
  ]
}
```

**Response:**
```json
{
  "results": [/* array of CalculationRead objects */],
  "total": 2,
  "successful": 2,
  "failed": 0
}
```

### `GET /health`
Health check endpoint.

**Response:** `{ "status": "ok" }`

## Running Tests

**Backend Tests:**
```bash
cd backend
pytest
# With coverage:
pytest --cov=app tests/
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## Assumptions

The following assumptions are made in this implementation:

1. **European-style options only**: The Black-Scholes model applies to European options that can only be exercised at expiration, not American options that can be exercised early.

2. **Continuous compounding**: All interest rates and dividend yields are assumed to be continuously compounded.

3. **Constant parameters**: Volatility and interest rates are assumed to be constant over the life of the option.

4. **Time in years**: All time-to-maturity inputs must be provided in years. Users are responsible for converting from days or months (e.g., 30 days = 30/365 ≈ 0.082 years).

5. **Decimal format for rates**: All rates (interest rate, dividend yield, volatility) must be entered as decimals:
   - **Backend/API**: expects decimals (e.g. 5% = 0.05).
   - **Frontend UI**: users enter percentages (e.g. `5`, `20`, `2.5`), which are converted to decimals before calling the API.

6. **No transaction costs**: The model assumes no transaction costs or taxes.

7. **Efficient markets**: The model assumes markets are efficient and there are no arbitrage opportunities.

8. **SQLite database**: The application uses SQLite for simplicity. The database file (`calculations.db`) is created automatically in the backend directory.

## Technical Details

### Black-Scholes Formula

The implementation uses the following formulas:

**Intermediate Calculations:**
- d₁ = (ln(S₀/X) + (r - d + 0.5·v²)·t) / (v·√t)
- d₂ = (ln(S₀/X) + (r - d - 0.5·v²)·t) / (v·√t)

**Option Prices:**
- Call Price: C = S₀·e^(-d·t)·N(d₁) - X·e^(-r·t)·N(d₂)
- Put Price: P = X·e^(-r·t)·N(-d₂) - S₀·e^(-d·t)·N(-d₁)

Where:
- N(x) is the cumulative standard normal distribution function (implemented using `scipy.stats.norm.cdf()`)
- e is the base of the natural logarithm

### Technologies Used

**Backend:**
- Python 3.8+ / FastAPI / SQLAlchemy / SQLite / scipy / Pydantic / pytest

**Frontend:**
- React 18 / TypeScript / CSS3 / Jest & React Testing Library

## Database Schema

**SQLite Database:** `backend/calculations.db` (auto-created on first run)

**Table: `calculations`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Primary key |
| `s0` | Float | Current stock price |
| `x` | Float | Strike price |
| `t` | Float | Time to maturity (years) |
| `r` | Float | Risk-free interest rate (decimal) |
| `d` | Float | Dividend yield (decimal) |
| `v` | Float | Volatility (decimal) |
| `call_price` | Float | Calculated call option price |
| `put_price` | Float | Calculated put option price |
| `created_at` | DateTime | Timestamp (UTC) |

## Error Handling

The application handles various error cases:
- Invalid input validation (negative prices, zero volatility, etc.)
- API connection errors
- Database errors
- Calculation errors

All errors are displayed to the user with appropriate error messages.

## Features

- ✅ **Single Calculation**: Calculate individual option prices with detailed results
- ✅ **Batch Calculations**: Process multiple parameter sets simultaneously from the main calculator table
- ✅ **Calculation History**: View and manage all previous calculations with pagination
- ✅ **Export & Copy**: Export or copy selected/all history rows as CSV, SQL, or JSON
- ✅ **Parameter Definitions & Formula Panel**: Built-in help explaining each input and the Black-Scholes formulas





