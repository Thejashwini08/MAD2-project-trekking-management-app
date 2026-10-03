import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "trekking-secret-key-change-in-prod")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'trekking.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
    REDIS_DB = int(os.environ.get("REDIS_DB", 0))

    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/1")
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", f"redis://{REDIS_HOST}:{REDIS_PORT}/2")

    # Login email for the pre-seeded Admin user account (do not change unless you
    # also want to change the login credentials used to sign in as Admin).
    ADMIN_LOGIN_EMAIL = os.environ.get("ADMIN_LOGIN_EMAIL", "ithejashwinim@gmail.com")

    # Where the monthly activity report gets emailed to (can be a different
    # inbox than the Admin's login email above).
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "ithejashwinim@gmail.com")

    # SMTP settings for real email delivery (daily reminders + monthly report).
    # Defaults below are pre-filled with the project's Gmail account.
    # Override any of these via environment variables if needed.
    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
    SMTP_USER = os.environ.get("SMTP_USER", "thejashwini647@gmail.com")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "<your smtp passoword>")
    SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)

    EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
    REPORTS_DIR = os.path.join(BASE_DIR, "reports")
    LOGS_DIR = os.path.join(BASE_DIR, "logs")

    # Send a reminder for any Open trek whose start_date falls within the next
    # N days (inclusive). Each booking is only reminded once (reminder_sent flag).
    REMINDER_WINDOW_DAYS = int(os.environ.get("REMINDER_WINDOW_DAYS", 3))
