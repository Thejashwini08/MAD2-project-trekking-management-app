from datetime import date
from flask import Blueprint, request, session, jsonify
from extensions import db
from models import Trek, Booking
from routes.decorators import login_required
from cache_utils import cache_delete_prefix

booking_bp = Blueprint("booking", __name__)


@booking_bp.route("", methods=["POST"])
@login_required(role="user")
def book_trek():
    data = request.get_json() or {}
    trek_id = data.get("trek_id")

    trek = Trek.query.get(trek_id)
    if trek is None:
        return jsonify({"error": "Trek not found"}), 404

    # Prevent duplicate booking of the same trek, even after it is completed
    existing = Booking.query.filter(
        Booking.user_id == session["user_id"],
        Booking.trek_id == trek_id,
        Booking.status.in_(["Booked", "Completed"]),
    ).first()
    if existing:
        return jsonify({"error": "You have already booked this trek"}), 400

    # Allow booking only when trek status is Open, and prevent overbooking
    if trek.status != "Open" or trek.available_slots <= 0:
        return jsonify({"error": "Trek is not open or slots are full"}), 400
    #trek status is Open and slots are available, proceed with booking
    booking = Booking(
        user_id=session["user_id"],
        trek_id=trek_id,
        booking_date=date.today().isoformat(),
        status="Booked",
    )
    trek.available_slots -= 1
    db.session.add(booking)
    db.session.commit()
    cache_delete_prefix("treks:")

    return jsonify(booking.to_dict()), 201


@booking_bp.route("", methods=["GET"])
@login_required(role="user")
def my_bookings():
    bookings = Booking.query.filter_by(user_id=session["user_id"]).all()
    return jsonify([b.to_dict() for b in bookings])


@booking_bp.route("/<int:booking_id>/cancel", methods=["PUT"])
@login_required(role="user")
def cancel_booking(booking_id):
    booking = Booking.query.filter_by(id=booking_id, user_id=session["user_id"]).first()
    if booking is None:
        return jsonify({"error": "Booking not found"}), 404

    if booking.status != "Booked":
        return jsonify({"error": "Only active bookings can be cancelled"}), 400

    booking.status = "Cancelled"
    trek = Trek.query.get(booking.trek_id)
    if trek:
        trek.available_slots += 1

    db.session.commit()
    cache_delete_prefix("treks:")
    return jsonify(booking.to_dict())


@booking_bp.route("/history", methods=["GET"])
@login_required(role="user")
def booking_history():
    bookings = Booking.query.filter_by(user_id=session["user_id"], status="Completed").all()
    return jsonify([b.to_dict() for b in bookings])
