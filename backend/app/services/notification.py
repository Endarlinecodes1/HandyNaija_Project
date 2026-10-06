"""Notification service for dispatching in-app alerts and SMS/email stubs."""

import logging
from typing import Optional

logger = logging.getLogger("handynaija.notifications")


class NotificationService:
    """Handles notification dispatch across channels (In-app, SMS, Email)."""

    @staticmethod
    def send_request_status_notification(
        recipient_email: str,
        recipient_phone: Optional[str],
        request_title: str,
        new_status: str,
    ) -> bool:
        """Simulate or dispatch notification for service request status transitions."""
        logger.info(
            f"Notification [Status Change]: Job '{request_title}' updated to '{new_status}' -> Sent to {recipient_email} / {recipient_phone}"
        )
        return True

    @staticmethod
    def send_message_alert(
        recipient_email: str,
        sender_name: str,
        snippet: str,
    ) -> bool:
        """Simulate or dispatch chat alert notification."""
        logger.info(
            f"Notification [New Message]: From {sender_name} to {recipient_email}: {snippet[:40]}..."
        )
        return True


notification_service = NotificationService()
