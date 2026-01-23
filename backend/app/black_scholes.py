from __future__ import annotations

import math
from typing import Tuple

from scipy.stats import norm


def _validate_inputs(
    s0: float, x: float, t: float, v: float
) -> None:
    if s0 <= 0 or x <= 0:
        raise ValueError("S0 and X must be positive.")
    if t <= 0:
        raise ValueError("Time to maturity t must be positive.")
    if v <= 0:
        raise ValueError("Volatility v must be positive.")


def calculate_d1_d2(
    s0: float, x: float, t: float, r: float, d: float, v: float
) -> Tuple[float, float]:
    """
    Calculate the d1 and d2 parameters used in the Black-Scholes formula.
    """
    _validate_inputs(s0, x, t, v)
    numerator = math.log(s0 / x) + (r - d + 0.5 * v * v) * t
    denominator = v * math.sqrt(t)
    d1 = numerator / denominator
    d2 = d1 - v * math.sqrt(t)
    return d1, d2


def calculate_call_put(
    s0: float, x: float, t: float, r: float, d: float, v: float
) -> Tuple[float, float, float, float]:
    """
    Calculate call and put prices using the Black-Scholes formula.

    Returns:
        call_price, put_price, d1, d2
    """
    d1, d2 = calculate_d1_d2(s0, x, t, r, d, v)
    nd1 = norm.cdf(d1)
    nd2 = norm.cdf(d2)
    n_minus_d1 = norm.cdf(-d1)
    n_minus_d2 = norm.cdf(-d2)

    discount_dividend = math.exp(-d * t)
    discount_rate = math.exp(-r * t)

    call_price = s0 * discount_dividend * nd1 - x * discount_rate * nd2
    put_price = x * discount_rate * n_minus_d2 - s0 * discount_dividend * n_minus_d1

    return call_price, put_price, d1, d2

