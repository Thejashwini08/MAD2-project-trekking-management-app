import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import Config

SMTP_CONFIGURED = bool(Config.SMTP_HOST and Config.SMTP_USER and Config.SMTP_PASSWORD)

if not SMTP_CONFIGURED:
    print("=" * 70)
    print("WARNING: SMTP is NOT configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD).")
    print("Daily reminders and the monthly report will NOT be emailed.")
    print("They will be logged to backend/logs/email_fallback_log.txt instead.")
    print("See README.md 'Sending Real Emails' section to fix this.")
    print("=" * 70)


def send_email(to_email, subject, html_body):
    """
    Sends a real email via SMTP if Config.SMTP_* is configured.
    If not configured, logs a warning to logs/email_fallback_log.txt instead
    of silently failing, so it's obvious in the demo why no mail arrived.
    Returns True if actually sent, False otherwise.
    """
    if not SMTP_CONFIGURED:
        os.makedirs(Config.LOGS_DIR, exist_ok=True)
        with open(os.path.join(Config.LOGS_DIR, "email_fallback_log.txt"), "a") as f:
            f.write(
                f"[SMTP NOT CONFIGURED] Would have sent to {to_email} | Subject: {subject}\n"
                f"Set SMTP_HOST / SMTP_USER / SMTP_PASSWORD env vars (see README) to send real email.\n\n"
            )
        print(f"[email_utils] SMTP not configured - skipped sending to {to_email} ('{subject}')")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = Config.SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        # Explicit timeout is critical: without it, a blocked/slow network can hang
        # this call indefinitely, which freezes the entire Celery worker (especially
        # with --pool=solo, since it's single-threaded) and stalls every task behind it.
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())

        print(f"[email_utils] Email sent to {to_email} ('{subject}')")
        return True

    except Exception as e:
        os.makedirs(Config.LOGS_DIR, exist_ok=True)
        with open(os.path.join(Config.LOGS_DIR, "email_fallback_log.txt"), "a") as f:
            f.write(f"[SMTP SEND FAILED] to {to_email} | Subject: {subject} | Error: {e}\n\n")
        print(f"[email_utils] FAILED to send to {to_email}: {e}")
        return False
