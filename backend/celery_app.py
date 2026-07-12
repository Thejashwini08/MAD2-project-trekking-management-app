from celery import Celery
from celery.schedules import crontab
from config import Config


def make_celery():
    celery_app = Celery(
        "trekking_tasks",
        broker=Config.CELERY_BROKER_URL,
        backend=Config.CELERY_RESULT_BACKEND,
        include=["tasks"],
    )
    celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="Asia/Kolkata",
        enable_utc=True,
    )
    celery_app.conf.beat_schedule = {
        "daily-trek-reminders": {
            "task": "tasks.send_daily_reminders",
            "schedule": crontab(hour=22, minute=35),   # runs every day at 8:00 AM
        },
        "monthly-admin-report": {
            "task": "tasks.generate_monthly_report",
            "schedule": crontab(day_of_month=11, hour=22, minute=35),  # 1st of every month, 6:00 AM
        },
    }
    return celery_app


celery = make_celery()
