import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import Calculation


class TestCalculationModel:
    """Test the Calculation database model."""

    def test_create_calculation(self, db_session: Session):
        """Test creating a calculation record."""
        calc = Calculation(
            s0=100.0,
            x=100.0,
            t=1.0,
            r=0.05,
            d=0.02,
            v=0.2,
            call_price=10.45,
            put_price=5.23,
        )
        db_session.add(calc)
        db_session.commit()
        db_session.refresh(calc)
        
        assert calc.id is not None
        assert calc.s0 == 100.0
        assert calc.x == 100.0
        assert calc.t == 1.0
        assert calc.r == 0.05
        assert calc.d == 0.02
        assert calc.v == 0.2
        assert calc.call_price == 10.45
        assert calc.put_price == 5.23
        assert isinstance(calc.created_at, datetime)

    def test_retrieve_calculation(self, db_session: Session):
        """Test retrieving a calculation from the database."""
        calc = Calculation(
            s0=110.0,
            x=100.0,
            t=0.5,
            r=0.03,
            d=0.01,
            v=0.25,
            call_price=12.34,
            put_price=2.56,
        )
        db_session.add(calc)
        db_session.commit()
        
        retrieved = db_session.query(Calculation).filter(Calculation.id == calc.id).first()
        assert retrieved is not None
        assert retrieved.s0 == 110.0
        assert retrieved.call_price == 12.34

    def test_multiple_calculations(self, db_session: Session):
        """Test storing and retrieving multiple calculations."""
        calc1 = Calculation(
            s0=100.0, x=100.0, t=1.0, r=0.05, d=0.0, v=0.2,
            call_price=10.0, put_price=5.0
        )
        calc2 = Calculation(
            s0=120.0, x=100.0, t=1.0, r=0.05, d=0.0, v=0.2,
            call_price=25.0, put_price=3.0
        )
        
        db_session.add(calc1)
        db_session.add(calc2)
        db_session.commit()
        
        all_calcs = db_session.query(Calculation).all()
        assert len(all_calcs) == 2
        assert all_calcs[0].s0 in [100.0, 120.0]
        assert all_calcs[1].s0 in [100.0, 120.0]

    def test_calculation_timestamps(self, db_session: Session):
        """Test that created_at timestamps are set correctly."""
        import time
        
        calc1 = Calculation(
            s0=100.0, x=100.0, t=1.0, r=0.05, d=0.0, v=0.2,
            call_price=10.0, put_price=5.0
        )
        db_session.add(calc1)
        db_session.commit()
        time1 = calc1.created_at
        
        time.sleep(0.1)  # Small delay
        
        calc2 = Calculation(
            s0=100.0, x=100.0, t=1.0, r=0.05, d=0.0, v=0.2,
            call_price=10.0, put_price=5.0
        )
        db_session.add(calc2)
        db_session.commit()
        time2 = calc2.created_at
        
        # Second calculation should have a later timestamp
        assert time2 >= time1
