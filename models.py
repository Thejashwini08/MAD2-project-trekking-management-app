from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class User(db.Model):
    """Unified user model. The 'role' field differentiates Admin / Staff / Trekker."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    contact = db.Column(db.String(30))
    role = db.Column(db.String(20), nullable=False)          # admin / staff / user
    status = db.Column(db.String(20), nullable=False, default="Approved")  # Approved / Blacklisted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    treks_assigned = db.relationship("Trek", backref="staff", foreign_keys="Trek.staff_id")
    bookings = db.relationship("Booking", backref="user", foreign_keys="Booking.user_id")

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "contact": self.contact,
            "role": self.role,
            "status": self.status,
        }


class Trek(db.Model):
    __tablename__ = "treks"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)     # Easy / Moderate / Hard
    duration = db.Column(db.Integer, nullable=False)          # days
    available_slots = db.Column(db.Integer, nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    status = db.Column(db.String(20), nullable=False, default="Pending")  # Pending/Approved/Open/Closed/Completed
    start_date = db.Column(db.String(20))
    end_date = db.Column(db.String(20))
    description = db.Column(db.Text)

    bookings = db.relationship("Booking", backref="trek", foreign_keys="Booking.trek_id")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "difficulty": self.difficulty,
            "duration": self.duration,
            "available_slots": self.available_slots,
            "staff_id": self.staff_id,
            "staff_name": self.staff.name if self.staff else None,
            "status": self.status,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "description": self.description,
        }


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey("treks.id"), nullable=False)
    booking_date = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Booked")   # Booked/Cancelled/Completed
    payment_status = db.Column(db.String(20), nullable=False, default="Not Required")
    reminder_sent = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "trek_id": self.trek_id,
            "trek_name": self.trek.name if self.trek else None,
            "trek_location": self.trek.location if self.trek else None,
            "trek_start_date": self.trek.start_date if self.trek else None,
            "trek_end_date": self.trek.end_date if self.trek else None,
            "booking_date": self.booking_date,
            "status": self.status,
            "payment_status": self.payment_status,
        }
