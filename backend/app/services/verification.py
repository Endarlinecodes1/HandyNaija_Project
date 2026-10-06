"""Artisan verification and identity validation business service."""

import logging
from typing import Tuple

logger = logging.getLogger("handynaija.verification")


class VerificationService:
    """Business logic for validating Nigerian National Identity (NIN) and artisan KYC."""

    @staticmethod
    def validate_nin_format(nin: str) -> Tuple[bool, str]:
        """Validate 11-digit numeric Nigerian National Identification Number format."""
        cleaned = nin.strip()
        if not cleaned.isdigit():
            return False, "NIN must contain only numeric digits."
        if len(cleaned) != 11:
            return False, "NIN must be exactly 11 digits long."
        return True, "Valid NIN format."


verification_service = VerificationService()
