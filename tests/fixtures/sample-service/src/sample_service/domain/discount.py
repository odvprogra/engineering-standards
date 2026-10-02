"""Percentage discounts on monetary amounts."""

from decimal import ROUND_HALF_EVEN, Decimal

HUNDRED = Decimal(100)
CENT = Decimal("0.01")


def apply_discount(amount: Decimal, percent: Decimal) -> Decimal:
    """Return ``amount`` reduced by ``percent``, rounded to cents with banker's rounding."""
    if not Decimal(0) <= percent <= HUNDRED:
        raise ValueError("percent must be between 0 and 100")
    return (amount * (HUNDRED - percent) / HUNDRED).quantize(CENT, rounding=ROUND_HALF_EVEN)
