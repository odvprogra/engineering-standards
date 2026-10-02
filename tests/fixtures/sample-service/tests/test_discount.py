from decimal import Decimal

import pytest

from sample_service.domain.discount import apply_discount


def test_apply_discount_ten_percent_reduces_amount() -> None:
    result = apply_discount(Decimal("200.00"), Decimal("10"))

    assert result == Decimal("180.00")


def test_apply_discount_half_cent_rounds_to_even() -> None:
    result = apply_discount(Decimal("0.25"), Decimal("50"))

    assert result == Decimal("0.12")


@pytest.mark.parametrize("percent", [Decimal("-1"), Decimal("100.01")])
def test_apply_discount_out_of_range_percent_raises(percent: Decimal) -> None:
    with pytest.raises(ValueError, match="between 0 and 100"):
        apply_discount(Decimal("10.00"), percent)
