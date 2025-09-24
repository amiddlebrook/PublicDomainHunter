"""
Email notification service.

Handles sending email notifications for alerts, password resets,
and other system communications.
"""

import os
import logging
from typing import List, Dict, Any
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from jinja2 import Template, Environment, FileSystemLoader
import asyncio
from pathlib import Path

logger = logging.getLogger(__name__)

class EmailService:
    """
    Service for sending email notifications.

    Handles SMTP configuration and email template rendering.
    """

    def __init__(self):
        """Initialize email service with SMTP configuration."""
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")

        # Template configuration
        self.template_dir = Path(__file__).parent / "templates" / "email"
        self.template_dir.mkdir(parents=True, exist_ok=True)

        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=True
        )

        self.available = bool(self.smtp_username and self.smtp_password)
        if self.available:
            logger.info("Email service initialized successfully")
        else:
            logger.warning("Email service not configured - notifications will be logged only")

    def is_available(self) -> bool:
        """Check if email service is properly configured."""
        return self.available

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """
        Send an email notification.

        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_content: HTML email content
            text_content: Plain text fallback content (optional)

        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.is_available():
            logger.info(f"Email not sent (service not configured): {subject} to {to_email}")
            return False

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"Public Domain Hunter <{self.smtp_username}>"
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add text and HTML versions
            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))

            msg.attach(MIMEText(html_content, 'html'))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully: {subject} to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def send_alert_notification(self, user_email: str, alert_data: Dict[str, Any]) -> bool:
        """
        Send alert notification email.

        Args:
            user_email: User's email address
            alert_data: Alert information

        Returns:
            True if email sent successfully
        """
        try:
            template = self.env.get_template('alert_notification.html')
            html_content = template.render(
                user_email=user_email,
                alert=alert_data,
                timestamp=datetime.now().isoformat()
            )

            text_template = self.env.get_template('alert_notification.txt')
            text_content = text_template.render(
                user_email=user_email,
                alert=alert_data,
                timestamp=datetime.now().isoformat()
            )

            subject = f"Public Domain Hunter Alert: {alert_data.get('alert_type', 'New Alert')}"

            return self.send_email(user_email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Failed to send alert notification: {e}")
            return False

    def send_password_reset(self, user_email: str, reset_token: str) -> bool:
        """
        Send password reset email.

        Args:
            user_email: User's email address
            reset_token: Password reset token

        Returns:
            True if email sent successfully
        """
        try:
            reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"

            template = self.env.get_template('password_reset.html')
            html_content = template.render(
                user_email=user_email,
                reset_url=reset_url,
                timestamp=datetime.now().isoformat()
            )

            text_template = self.env.get_template('password_reset.txt')
            text_content = text_template.render(
                user_email=user_email,
                reset_url=reset_url,
                timestamp=datetime.now().isoformat()
            )

            subject = "Public Domain Hunter - Password Reset Request"

            return self.send_email(user_email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            return False

    def send_welcome_email(self, user_email: str, username: str) -> bool:
        """
        Send welcome email to new users.

        Args:
            user_email: User's email address
            username: User's username

        Returns:
            True if email sent successfully
        """
        try:
            login_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login"

            template = self.env.get_template('welcome.html')
            html_content = template.render(
                user_email=user_email,
                username=username,
                login_url=login_url,
                timestamp=datetime.now().isoformat()
            )

            text_template = self.env.get_template('welcome.txt')
            text_content = text_template.render(
                user_email=user_email,
                username=username,
                login_url=login_url,
                timestamp=datetime.now().isoformat()
            )

            subject = "Welcome to Public Domain Hunter!"

            return self.send_email(user_email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
            return False

    def send_weekly_digest(self, user_email: str, digest_data: Dict[str, Any]) -> bool:
        """
        Send weekly digest email.

        Args:
            user_email: User's email address
            digest_data: Weekly digest information

        Returns:
            True if email sent successfully
        """
        try:
            template = self.env.get_template('weekly_digest.html')
            html_content = template.render(
                user_email=user_email,
                digest=digest_data,
                timestamp=datetime.now().isoformat()
            )

            text_template = self.env.get_template('weekly_digest.txt')
            text_content = text_template.render(
                user_email=user_email,
                digest=digest_data,
                timestamp=datetime.now().isoformat()
            )

            subject = "Public Domain Hunter - Weekly Digest"

            return self.send_email(user_email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Failed to send weekly digest: {e}")
            return False

# Global email service instance
_email_service = None

def get_email_service() -> EmailService:
    """
    Get or create email service instance.

    Returns:
        EmailService instance
    """
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
