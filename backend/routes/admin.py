from flask import Blueprint, request, jsonify
from extensions import db
from models import User, Trek, Booking
from routes.decorators import login_required
from cache_utils import cache_delete_prefix

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/dashboard", methods=["GET"])
@login_required(role="admin")
def dashboard():
    return jsonify({
        "total_treks": Trek.query.count(),
        "total_users": User.query.filter_by(role="user").count(),
        "total_staff": User.query.filter_by(role="staff").count(),
        "total_bookings": Booking.query.count(),
        "recent_bookings": [b.to_dict() for b in Booking.query.order_by(Booking.id.desc()).limit(5).all()],
    })


# ---------- Treks ----------

@admin_bp.route("/treks", methods=["GET"])
@login_required(role="admin")
def list_treks():
    treks = Trek.query.all()
    return jsonify([t.to_dict() for t in treks])


@admin_bp.route("/treks", methods=["POST"])
@login_required(role="admin")
def add_trek():
    data = request.get_json() or {}
    required = ["name", "location", "difficulty", "duration", "available_slots", "start_date", "end_date"]
    if not all(data.get(f) for f in required):
        return jsonify({"error": "Missing required trek fields"}), 400

    staff_id = data.get("staff_id") or None
    # If a staff member is assigned right at creation time, the trek is ready
    # to accept bookings immediately, so it goes straight to Open instead of
    # sitting in Pending until someone edits it again just to assign staff.
    status = "Open" if staff_id else "Pending"

    trek = Trek(
        name=data["name"],
        location=data["location"],
        difficulty=data["difficulty"],
        duration=data["duration"],
        available_slots=data["available_slots"],
        staff_id=staff_id,
        status=status,
        start_date=data["start_date"],
        end_date=data["end_date"],
        description=data.get("description", ""),
    )
    db.session.add(trek)
    db.session.commit()
    cache_delete_prefix("treks:")
    return jsonify(trek.to_dict()), 201


@admin_bp.route("/treks/<int:trek_id>", methods=["PUT"])
@login_required(role="admin")
def update_trek(trek_id):
    trek = Trek.query.get(trek_id)
    if trek is None:
        return jsonify({"error": "Trek not found"}), 404

    data = request.get_json() or {}
    trek.name = data.get("name", trek.name)
    trek.location = data.get("location", trek.location)
    trek.difficulty = data.get("difficulty", trek.difficulty)
    trek.duration = data.get("duration", trek.duration)
    trek.available_slots = data.get("available_slots", trek.available_slots)
    if "staff_id" in data:
        trek.staff_id = data["staff_id"] or None
    trek.status = data.get("status", trek.status)
    trek.start_date = data.get("start_date", trek.start_date)
    trek.end_date = data.get("end_date", trek.end_date)
    trek.description = data.get("description", trek.description)

    db.session.commit()
    cache_delete_prefix("treks:")
    return jsonify(trek.to_dict())


@admin_bp.route("/treks/<int:trek_id>", methods=["DELETE"])
@login_required(role="admin")
def delete_trek(trek_id):
    trek = Trek.query.get(trek_id)
    if trek:
        db.session.delete(trek)
        db.session.commit()
        cache_delete_prefix("treks:")
    return jsonify({"message": "Trek deleted"})


# ---------- Staff (created directly by Admin - no self-registration) ----------

@admin_bp.route("/staff", methods=["GET"])
@login_required(role="admin")
def list_staff():
    staff = User.query.filter_by(role="staff").all()
    return jsonify([s.to_dict() for s in staff])


@admin_bp.route("/staff", methods=["POST"])
@login_required(role="admin")
def add_staff():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    contact = data.get("contact", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 400

    staff = User(name=name, email=email, contact=contact, role="staff", status="Approved")
    staff.set_password(password)
    db.session.add(staff)
    db.session.commit()
    return jsonify(staff.to_dict()), 201


@admin_bp.route("/staff/<int:staff_id>/blacklist", methods=["PUT"])
@login_required(role="admin")
def blacklist_staff(staff_id):
    staff = User.query.get(staff_id)
    if staff:
        staff.status = "Blacklisted"
        db.session.commit()
    return jsonify({"message": "Staff blacklisted"})


@admin_bp.route("/staff/<int:staff_id>/unblacklist", methods=["PUT"])
@login_required(role="admin")
def unblacklist_staff(staff_id):
    staff = User.query.get(staff_id)
    if staff:
        staff.status = "Approved"
        db.session.commit()
    return jsonify({"message": "Staff unblacklisted"})


# ---------- Users ----------

@admin_bp.route("/users", methods=["GET"])
@login_required(role="admin")
def list_users():
    users = User.query.filter_by(role="user").all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.route("/users/<int:user_id>/blacklist", methods=["PUT"])
@login_required(role="admin")
def blacklist_user(user_id):
    user = User.query.get(user_id)
    if user:
        user.status = "Blacklisted"
        db.session.commit()
    return jsonify({"message": "User blacklisted"})


@admin_bp.route("/users/<int:user_id>/unblacklist", methods=["PUT"])
@login_required(role="admin")
def unblacklist_user(user_id):
    user = User.query.get(user_id)
    if user:
        user.status = "Approved"
        db.session.commit()
    return jsonify({"message": "User unblacklisted"})


# ---------- Bookings & Search ----------

@admin_bp.route("/bookings", methods=["GET"])
@login_required(role="admin")
def all_bookings():
    bookings = Booking.query.order_by(Booking.id.desc()).all()
    return jsonify([b.to_dict() for b in bookings])


@admin_bp.route("/search", methods=["GET"])
@login_required(role="admin")
def search():
    search_type = request.args.get("type", "treks")
    q = request.args.get("q", "")

    if search_type == "treks":
        results = Trek.query.filter(
            (Trek.name.like(f"%{q}%")) | (Trek.location.like(f"%{q}%"))
        ).all()
    elif search_type == "staff":
        id_match = int(q) if q.isdigit() else -1
        results = User.query.filter_by(role="staff").filter(
            (User.name.like(f"%{q}%")) | (User.id == id_match)
        ).all()
    else:
        id_match = int(q) if q.isdigit() else -1
        results = User.query.filter_by(role="user").filter(
            (User.name.like(f"%{q}%")) | (User.id == id_match)
        ).all()

    return jsonify([r.to_dict() for r in results])
