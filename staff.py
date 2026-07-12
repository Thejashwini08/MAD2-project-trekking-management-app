from flask import Blueprint, request, session, jsonify
from extensions import db
from models import Trek, Booking, User
from routes.decorators import login_required
from cache_utils import cache_delete_prefix

staff_bp = Blueprint("staff", __name__)


@staff_bp.route("/dashboard", methods=["GET"])
@login_required(role="staff")
def dashboard():
    staff_id = session["user_id"]
    treks = Trek.query.filter_by(staff_id=staff_id).all()

    total_participants = 0
    for t in treks:
        total_participants += Booking.query.filter_by(trek_id=t.id, status="Booked").count()

    open_treks = Trek.query.filter_by(staff_id=staff_id, status="Open").count()

    return jsonify({
        "treks": [t.to_dict() for t in treks],
        "total_participants": total_participants,
        "open_treks": open_treks,
    })


@staff_bp.route("/treks/<int:trek_id>", methods=["GET"])
@login_required(role="staff")
def trek_detail(trek_id):
    # Ensure only the assigned staff member can view/manage this trek
    trek = Trek.query.filter_by(id=trek_id, staff_id=session["user_id"]).first()
    if trek is None:
        return jsonify({"error": "Trek not found or not assigned to you"}), 404

    participants = []
    for b in Booking.query.filter_by(trek_id=trek_id).all():
        u = User.query.get(b.user_id)
        participants.append({
            "id": b.id,
            "name": u.name if u else "-",
            "email": u.email if u else "-",
            "booking_date": b.booking_date,
            "status": b.status,
        })

    return jsonify({"trek": trek.to_dict(), "participants": participants})


@staff_bp.route("/treks/<int:trek_id>", methods=["PUT"])
@login_required(role="staff")
def update_trek(trek_id):
    # Ensure only assigned staff can manage a trek
    trek = Trek.query.filter_by(id=trek_id, staff_id=session["user_id"]).first()
    if trek is None:
        return jsonify({"error": "Trek not found or not assigned to you"}), 404

    data = request.get_json() or {}
    if "available_slots" in data:
        trek.available_slots = data["available_slots"]
    if "status" in data:
        trek.status = data["status"]

    db.session.commit()

    # Trek status drives booking status: marking a trek Completed auto-completes its active bookings
    if trek.status == "Completed":
        Booking.query.filter_by(trek_id=trek_id, status="Booked").update({"status": "Completed"})
        db.session.commit()

    cache_delete_prefix("treks:")
    return jsonify(trek.to_dict())
