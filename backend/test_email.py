"""
Quick standalone SMTP test - run this BEFORE starting Flask/Celery to confirm
your email credentials actually work.

Usage:
    cd backend
    python test_email.py your-email@example.com
"""
import sys
from email_utils import send_email

if __name__ == "__main__":
    to = sys.argv[1] if len(sys.argv) > 1 else "rajneeshnain2022@gmail.com"
    print(f"Attempting to send a test email to {to}...")
    result = send_email(
        to,
        "Test Email - Trekking Management App",
        "<h3>SMTP is working!</h3><p>If you received this, your email configuration in config.py is correct.</p>",
    )
    if result:
        print("SUCCESS: Email sent. Check the inbox (and spam folder).")
    else:
        print("FAILED: See the [email_utils] message above, or check logs/email_fallback_log.txt for details.")
        print("Common causes: wrong App Password, 2FA not enabled on the Gmail account,")
        print("or 'Less secure app access' / App Passwords not set up correctly.")
