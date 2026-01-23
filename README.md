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

**Windows (PowerShell):**
```powershell
cd black-scholes-calculator
powershell -ExecutionPolicy Bypass -File .\install_dependencies.ps1
```

This script automatically installs all backend (Python) and frontend (Node.js) dependencies.

**Manual Installation (Alternative):**
```bash
# Backend
cd backend
python -m pip install --upgrade pip setuptools wheel
python -m pip install --prefer-binary -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Run the Application

**Start Backend (Terminal 1):**
```bash
cd backend
uvicorn app.main:app --reload
```
Backend runs at `http://localhost:8000`  
API docs available at `http://localhost:8000/docs`

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm start
```
Frontend opens at `http://localhost:3000`

**Note:** Ensure the backend is running before starting the frontend.

### Troubleshooting

- **Python 3.14+ compatibility:** If `scipy` installation fails, use Python 3.11 or 3.12, or try: `python -m pip install scipy --only-binary :all:`
- **Virtual environment (recommended):** Create one with `python -m venv venv` and activate it before installing dependencies

## Usage

1. **Calculate Option Prices:**
   - Enter the required parameters in the **Calculator** tab:
     - **S₀**: Current stock price (must be positive)
     - **X**: Strike price (must be positive)
     - **t**: Time to maturity in years (must be positive)
     - **r**: Risk-free interest rate
     - **d**: Dividend yield
     - **v**: Volatility
   - For **r**, **d** and **v** you can choose between **Percent (%)** and **Decimal** input modes:
     - Percent example: `5` → interpreted as `5%` → sent to the API as `0.05`
     - Decimal example: `0.05` → interpreted directly as `5%`
   - A parameter definition panel below the form explains each input and the conventions used.
   - Click **“Calculate Black-Scholes Prices”** to compute call and put option prices.
   - The results panel displays the calculated prices and intermediate values (d₁, d₂) along with a timestamp.

2. **View History:**
   - Click on the **History** tab to view all previous calculations.
   - The table shows inputs (S₀, X, t, r, d, v) and the resulting call/put prices.
   - Click **Refresh** to reload the history.

3. **Batch Calculations:**
   - Click on the **Batch** tab to calculate multiple option prices at once.
   - Add multiple rows with different parameter sets.
   - All calculations are processed in a single API call for efficiency.
   - Results show successful/failed counts and a table of all calculated prices.

## Challenge Requirements Checklist

- **React + TypeScript frontend** for input, results, and history views.
- **FastAPI + Python backend** implementing the Black‑Scholes formula including dividend yield.
- **SQLite database** for persisting calculation history.
- **API layer** to calculate prices and retrieve history.
- **Tests**:
  - Backend: unit tests for pricing logic, API tests, and model tests.
  - Frontend: tests for core components and API client.
- **GitHub repository** with clear documentation and setup instructions.
- **User-friendly UI** with percentage/decimal toggle and in‑context parameter definitions.

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
   - 5% = 0.05
   - 20% = 0.20
   - 2.5% = 0.025

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
- ✅ **Batch Calculations**: Process multiple parameter sets simultaneously
- ✅ **Calculation History**: View and manage all previous calculations
- ✅ **Flexible Input**: Support for both percentage and decimal input formats
- ✅ **Parameter Definitions**: Built-in help panel explaining each input parameter

## Future Enhancements

Potential improvements:
- Add support for American options
- Implement Greeks calculation (Delta, Gamma, Theta, Vega, Rho)
- Add option to export history to CSV
- Implement pagination for large history lists
- Add user authentication and personal calculation history


