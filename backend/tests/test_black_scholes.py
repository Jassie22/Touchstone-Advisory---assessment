import math
import pytest
from app.black_scholes import calculate_d1_d2, calculate_call_put


class TestCalculateD1D2:
    """Test the d1 and d2 calculation functions."""

    def test_basic_calculation(self):
        """Test d1 and d2 with standard inputs."""
        s0, x, t, r, d, v = 100.0, 100.0, 1.0, 0.05, 0.02, 0.2
        d1, d2 = calculate_d1_d2(s0, x, t, r, d, v)
        
        # Verify d1 and d2 are calculated correctly
        expected_numerator = math.log(s0 / x) + (r - d + 0.5 * v * v) * t
        expected_denominator = v * math.sqrt(t)
        expected_d1 = expected_numerator / expected_denominator
        expected_d2 = expected_d1 - v * math.sqrt(t)
        
        assert abs(d1 - expected_d1) < 1e-10
        assert abs(d2 - expected_d2) < 1e-10

    def test_at_the_money(self):
        """Test when stock price equals strike price."""
        s0, x, t, r, d, v = 100.0, 100.0, 0.5, 0.05, 0.0, 0.2
        d1, d2 = calculate_d1_d2(s0, x, t, r, d, v)
        
        # When S0 = X, ln(S0/X) = 0
        # d1 should be positive due to (r - d + 0.5*v^2)*t term
        assert d1 > 0
        assert d2 < d1

    def test_in_the_money_call(self):
        """Test when stock price is above strike price."""
        s0, x, t, r, d, v = 110.0, 100.0, 1.0, 0.05, 0.0, 0.2
        d1, d2 = calculate_d1_d2(s0, x, t, r, d, v)
        
        # When S0 > X, ln(S0/X) > 0, so d1 should be larger
        assert d1 > 0

    def test_out_of_the_money_call(self):
        """Test when stock price is below strike price."""
        s0, x, t, r, d, v = 90.0, 100.0, 1.0, 0.05, 0.0, 0.2
        d1, d2 = calculate_d1_d2(s0, x, t, r, d, v)
        
        # When S0 < X, ln(S0/X) < 0
        # d1 might still be positive or negative depending on other factors
        assert d2 < d1

    def test_validation_negative_s0(self):
        """Test that negative stock price raises ValueError."""
        with pytest.raises(ValueError, match="S0 and X must be positive"):
            calculate_d1_d2(-100.0, 100.0, 1.0, 0.05, 0.0, 0.2)

    def test_validation_negative_x(self):
        """Test that negative strike price raises ValueError."""
        with pytest.raises(ValueError, match="S0 and X must be positive"):
            calculate_d1_d2(100.0, -100.0, 1.0, 0.05, 0.0, 0.2)

    def test_validation_zero_t(self):
        """Test that zero time to maturity raises ValueError."""
        with pytest.raises(ValueError, match="Time to maturity t must be positive"):
            calculate_d1_d2(100.0, 100.0, 0.0, 0.05, 0.0, 0.2)

    def test_validation_negative_v(self):
        """Test that negative volatility raises ValueError."""
        with pytest.raises(ValueError, match="Volatility v must be positive"):
            calculate_d1_d2(100.0, 100.0, 1.0, 0.05, 0.0, -0.2)


class TestCalculateCallPut:
    """Test the call and put price calculation functions."""

    def test_basic_calculation(self):
        """Test call and put prices with standard inputs."""
        s0, x, t, r, d, v = 100.0, 100.0, 1.0, 0.05, 0.02, 0.2
        call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
        
        # Prices should be positive
        assert call_price > 0
        assert put_price > 0
        
        # Call price should generally be higher than put for at-the-money with positive interest
        # (though this depends on the specific parameters)
        assert isinstance(call_price, float)
        assert isinstance(put_price, float)

    def test_reference_values(self):
        """Test with known reference values from financial calculators."""
        # Standard test case: S0=100, X=100, t=1, r=0.05, d=0, v=0.2
        s0, x, t, r, d, v = 100.0, 100.0, 1.0, 0.05, 0.0, 0.2
        call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
        
        # Approximate expected values (may vary slightly based on implementation)
        # Call price should be around 10-12 for these parameters
        assert 8.0 < call_price < 15.0
        assert 3.0 < put_price < 8.0

    def test_put_call_parity(self):
        """Test put-call parity: C - P = S0*e^(-d*t) - X*e^(-r*t)"""
        s0, x, t, r, d, v = 100.0, 100.0, 1.0, 0.05, 0.02, 0.2
        call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
        
        # Put-call parity relationship
        left_side = call_price - put_price
        right_side = s0 * math.exp(-d * t) - x * math.exp(-r * t)
        
        # Should be approximately equal (within numerical precision)
        assert abs(left_side - right_side) < 1e-6

    def test_zero_dividend(self):
        """Test calculation with zero dividend yield."""
        s0, x, t, r, d, v = 100.0, 100.0, 0.5, 0.05, 0.0, 0.25
        call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
        
        assert call_price > 0
        assert put_price > 0

    def test_high_volatility(self):
        """Test with high volatility."""
        s0, x, t, r, d, v = 100.0, 100.0, 1.0, 0.05, 0.0, 0.5
        call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
        
        # Higher volatility should lead to higher option prices
        assert call_price > 0
        assert put_price > 0

    def test_short_time_to_maturity(self):
        """Test with short time to maturity."""
        s0, x, t, r, d, v = 100.0, 100.0, 0.01, 0.05, 0.0, 0.2
        call_price, put_price, d1, d2 = calculate_call_put(s0, x, t, r, d, v)
        
        # Short time should result in lower option prices
        assert call_price >= 0
        assert put_price >= 0

    def test_validation_propagates(self):
        """Test that validation errors from d1/d2 propagate."""
        with pytest.raises(ValueError):
            calculate_call_put(-100.0, 100.0, 1.0, 0.05, 0.0, 0.2)
