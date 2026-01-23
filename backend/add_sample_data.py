"""
Script to add 100 random sample calculations to the database.

Prerequisites:
    - Python dependencies must be installed first
    - Run from project root: python -m pip install -r backend/requirements.txt
    - Or use the install script: powershell -ExecutionPolicy Bypass -File .\\install_dependencies.ps1

Usage:
    cd backend
    python add_sample_data.py
"""
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Check for required dependencies
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
except ImportError:
    print("❌ Error: SQLAlchemy not found.")
    print("Please install dependencies first:")
    print("  python -m pip install -r requirements.txt")
    print("Or from project root:")
    print("  powershell -ExecutionPolicy Bypass -File .\\install_dependencies.ps1")
    sys.exit(1)

try:
    from scipy.stats import norm
except ImportError:
    print("❌ Error: scipy not found.")
    print("Please install dependencies first:")
    print("  python -m pip install -r requirements.txt")
    sys.exit(1)

# Add parent directory to path to import app modules
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import models and calculation logic directly
try:
    from app.models import Calculation, Base
    from app.black_scholes import calculate_call_put
except ImportError as e:
    print(f"❌ Error importing app modules: {e}")
    print("Make sure you're running from the backend directory.")
    sys.exit(1)

# Create database connection (same as in database.py)
SQLALCHEMY_DATABASE_URL = "sqlite:///./calculations.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def generate_sample_data():
    """Generate 100 random Black-Scholes calculations."""
    db = SessionLocal()
    
    try:
        # Generate 100 random calculations
        for i in range(100):
            # Random parameters within reasonable ranges
            s0 = round(random.uniform(50, 200), 2)  # Stock price: $50-$200
            x = round(random.uniform(50, 200), 2)   # Strike price: $50-$200
            t = round(random.uniform(0.1, 5.0), 2)  # Time: 0.1-5 years
            r = round(random.uniform(0.01, 0.10), 4)  # Interest rate: 1%-10%
            d = round(random.uniform(0.0, 0.05), 4)   # Dividend yield: 0%-5%
            v = round(random.uniform(0.10, 0.50), 4)  # Volatility: 10%-50%
            
            try:
                # Calculate prices
                call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
                
                # Create calculation with random timestamp (within last 30 days)
                days_ago = random.randint(0, 30)
                created_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))
                
                calc = Calculation(
                    s0=s0,
                    x=x,
                    t=t,
                    r=r,
                    d=d,
                    v=v,
                    call_price=call_price,
                    put_price=put_price,
                    created_at=created_at
                )
                
                db.add(calc)
                if (i + 1) % 10 == 0:
                    print(f"Added {i+1}/100 calculations...")
                
            except ValueError as e:
                print(f"Skipping invalid calculation {i+1}: {e}")
                continue
        
        db.commit()
        print("\n✅ Successfully added 100 sample calculations to the database!")
        print(f"Database file: {Path(__file__).parent / 'calculations.db'}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Black-Scholes Sample Data Generator")
    print("=" * 60)
    print("Generating 100 random sample calculations...\n")
    generate_sample_data()
