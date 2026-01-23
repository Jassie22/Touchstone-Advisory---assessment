from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer

from .database import Base


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    s0 = Column(Float, nullable=False)  # Current stock price
    x = Column(Float, nullable=False)  # Strike price
    t = Column(Float, nullable=False)  # Time to maturity (years)
    r = Column(Float, nullable=False)  # Risk-free interest rate
    d = Column(Float, nullable=False)  # Dividend yield
    v = Column(Float, nullable=False)  # Volatility
    call_price = Column(Float, nullable=False)
    put_price = Column(Float, nullable=False)
    created_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, index=True
    )

