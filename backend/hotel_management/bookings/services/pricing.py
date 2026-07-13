from decimal import Decimal


def calculate_booking_price(room, check_in, check_out):
    """
    Calculates booking pricing.
    Returns:
        {
            "nights": int,
            "total": Decimal
        }
    """
    nights = (check_out - check_in).days
    if nights < 1:
        raise ValueError("Booking must be at least one night.")
    total = Decimal(room.price_per_night) * Decimal(nights)
    return {
        "nights": nights,
        "total": total,
    }
