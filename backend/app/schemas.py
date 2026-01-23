from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CalculationBase(BaseModel):
    s0: float = Field(..., description="Current stock price", gt=0)
    x: float = Field(..., description="Strike price", gt=0)
    t: float = Field(..., description="Time to maturity in years", gt=0)
    r: float = Field(..., description="Risk-free interest rate (annual, decimal)")
    d: float = Field(..., description="Dividend yield (annual, decimal)")
    v: float = Field(..., description="Volatility (annualised, decimal)", gt=0)


class CalculationCreate(CalculationBase):
    pass


class CalculationRead(CalculationBase):
    id: int
    call_price: float
    put_price: float
    d1: float
    d2: float
    created_at: datetime

    class Config:
        from_attributes = True


class CalculationSummary(BaseModel):
    id: int
    s0: float
    x: float
    t: float
    r: float
    d: float
    v: float
    call_price: float
    put_price: float
    created_at: datetime

    class Config:
        from_attributes = True


class BatchCalculationRequest(BaseModel):
    calculations: List[CalculationCreate] = Field(..., min_items=1, max_items=100)


class BatchCalculationResponse(BaseModel):
    results: List[CalculationRead]
    total: int
    successful: int
    failed: int

