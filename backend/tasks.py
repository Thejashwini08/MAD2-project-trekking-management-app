import os
import csv
from datetime import datetime, timedelta
from celery_app import celery
from config import Config
from email_utils import send_email

# The Flask app is built once here so tasks can run DB queries inside its app context.
from app import create_app
flask_app = create_app()


@celery.task(name="tasks.send_daily_reminders")
def send_daily_reminders():
    """
    Scheduled daily job: emails users about treks starting soon.
    Sends a reminder once per booking (tracked via Booking.reminder_sent) for
    any Open trek whose start_date falls within the next
    Config.REMINDER_WINDOW_DAYS days - not just exactly "tomorrow" - so a
    trek created a few days out still gets reminders sent ahead of time.
    Requires SMTP_HOST/SMTP_USER/SMTP_PASSWORD to be set (see README) to
    actually send mail; otherwise it logs to logs/email_fallback_log.txt.
    """
    with flask_app.app_context():
        from extensions import db
        from models import Trek, Booking, User

        today = datetime.utcnow().date()
        window_end = today + timedelta(days=Config.REMINDER_WINDOW_DAYS)

        upcoming_treks = Trek.query.filter(Trek.status == "Open").all()
        upcoming_treks = [
            t for t in upcoming_treks
            if t.start_date and today < datetime.strptime(t.start_date, "%Y-%m-%d").date() <= window_end
        ]

        sent = 0
        for trek in upcoming_treks:
            # Only remind bookings that haven't been reminded yet
            pending_bookings = Booking.query.filter_by(
                trek_id=trek.id, status="Booked", reminder_sent=False
            ).all()
            for b in pending_bookings:
                user = User.query.get(b.user_id)
                if not user:
                    continue
                html = f"""
                <html><body style="font-family: sans-serif;">
                <h3>Trek Reminder: {trek.name}</h3>
                <p>Hi {user.name},</p>
                <p>Your trek <b>{trek.name}</b> at <b>{trek.location}</b> starts on
                <b>{trek.start_date}</b>.</p>
                <p><b>Duration:</b> {trek.duration} day(s)<br>
                <b>Difficulty:</b> {trek.difficulty}</p>
                <p>Please arrive prepared and on time. Have a great trek!</p>
                </body></html>
                """
                if send_email(user.email, f"Reminder: {trek.name} starts on {trek.start_date}", html):
                    b.reminder_sent = True
                    sent += 1

        db.session.commit()
        return f"Sent {sent} reminder(s) across {len(upcoming_treks)} upcoming trek(s) (window: next {Config.REMINDER_WINDOW_DAYS} days)"


@celery.task(name="tasks.generate_monthly_report")
def generate_monthly_report():
    """
    Scheduled monthly job (runs on the 1st): builds an HTML activity report
    for the Admin, saves it to reports/, and emails it to Config.ADMIN_EMAIL.
    """
    with flask_app.app_context():
        from extensions import db
        from models import Trek, Booking, User

        os.makedirs(Config.REPORTS_DIR, exist_ok=True)

        total_treks = Trek.query.count()
        completed_treks = Trek.query.filter_by(status="Completed").count()
        total_bookings = Booking.query.count()
        total_users = User.query.filter_by(role="user").count()

        popular = (
            db.session.query(Trek.name, db.func.count(Booking.id).label("cnt"))
            .join(Booking, Booking.trek_id == Trek.id)
            .group_by(Trek.id)
            .order_by(db.desc("cnt"))
            .limit(5)
            .all()
        )
        rows_html = "".join(f"<tr><td>{name}</td><td>{cnt}</td></tr>" for name, cnt in popular) or \
            "<tr><td colspan='2'>No bookings yet</td></tr>"

        month_label = datetime.utcnow().strftime("%B %Y")
        html = f"""<html><body style="font-family: sans-serif;">
<h2>Monthly Trekking Activity Report - {month_label}</h2>
<ul>
  <li>Total Treks: {total_treks}</li>
  <li>Completed Treks: {completed_treks}</li>
  <li>Total Bookings: {total_bookings}</li>
  <li>Total Registered Trekkers: {total_users}</li>
</ul>
<h3>Top Treks by Bookings</h3>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Trek</th><th>Bookings</th></tr>
{rows_html}
</table>
</body></html>"""

        filename = f"monthly_report_{datetime.utcnow().strftime('%Y_%m')}.html"
        filepath = os.path.join(Config.REPORTS_DIR, filename)
        with open(filepath, "w") as f:
            f.write(html)

        sent = send_email(Config.ADMIN_EMAIL, f"Monthly Trekking Report - {month_label}", html)

        return {"filename": filename, "emailed": sent}


@celery.task(name="tasks.export_user_bookings_csv", bind=True)
def export_user_bookings_csv(self, user_id):
    """
    User-triggered async job: exports the calling user's booking history to CSV.
    Triggered from the user dashboard/history page; frontend polls task status
    and shows an alert + download link once the job completes.
    """
    with flask_app.app_context():
        from models import User, Booking

        os.makedirs(Config.EXPORTS_DIR, exist_ok=True)
        user = User.query.get(user_id)
        bookings = Booking.query.filter_by(user_id=user_id).all()

        filename = f"booking_history_user_{user_id}_{self.request.id}.csv"
        filepath = os.path.join(Config.EXPORTS_DIR, filename)

        with open(filepath, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["User ID", "Trek Name", "Location", "Booking Status", "Booking Date",
                              "Trek Start Date", "Trek End Date"])
            for b in bookings:
                trek = b.trek
                writer.writerow([
                    user_id,
                    trek.name if trek else "-",
                    trek.location if trek else "-",
                    b.status,
                    b.booking_date,
                    trek.start_date if trek else "-",
                    trek.end_date if trek else "-",
                ])

        return {"filename": filename, "status": "done", "user": user.email if user else None}
