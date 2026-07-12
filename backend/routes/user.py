import os
from flask import Blueprint, request, session, jsonify, send_from_directory
from extensions import db
from models import User, Trek, Booking
from routes.decorators import login_required
from config import Config

user_bp = Blueprint("user", __name__)


@user_bp.route("/dashboard", methods=["GET"])
@login_required(role="user")
def dashboard():
    treks = Trek.query.filter_by(status="Open").all()
    bookings = Booking.query.filter_by(user_id=session["user_id"]).all()
    return jsonify({
        "treks": [t.to_dict() for t in treks],
        "bookings": [b.to_dict() for b in bookings],
    })


@user_bp.route("/profile", methods=["GET"])
@login_required(role="user")
def get_profile():
    user = User.query.get(session["user_id"])
    return jsonify(user.to_dict())


@user_bp.route("/profile", methods=["PUT"])
@login_required(role="user")
def update_profile():
    user = User.query.get(session["user_id"])
    data = request.get_json() or {}
    user.name = data.get("name", user.name)
    user.contact = data.get("contact", user.contact)
    db.session.commit()
    session["name"] = user.name
    return jsonify(user.to_dict())


# ---------- Celery-triggered async CSV export ----------

@user_bp.route("/export", methods=["POST"])
@login_required(role="user")
def trigger_export():
    from tasks import export_user_bookings_csv
    try:
        task = export_user_bookings_csv.delay(session["user_id"])
    except Exception as e:
        return jsonify({"error": f"Could not queue export job. Is Redis/Celery running? ({e})"}), 503
    return jsonify({"task_id": task.id})


@user_bp.route("/export/status/<task_id>", methods=["GET"])
@login_required(role="user")
def export_status(task_id):
    from tasks import export_user_bookings_csv
    result = export_user_bookings_csv.AsyncResult(task_id)

    if result.state == "SUCCESS":
        result_data = result.result or {}
        user = User.query.get(session["user_id"])
        # Verify this export actually belongs to the requesting user before revealing the filename
        if user is None or result_data.get("user") != user.email:
            return jsonify({"error": "Forbidden"}), 403
        return jsonify({"state": result.state, "filename": result_data.get("filename")})
    elif result.state == "FAILURE":
        return jsonify({"state": result.state, "error": str(result.result)})
    return jsonify({"state": result.state})


@user_bp.route("/export/download/<path:filename>", methods=["GET"])
@login_required(role="user")
def export_download(filename):
    # Filenames are of the form booking_history_user_<id>_<task-uuid>.csv - verify
    # the embedded user id matches the session before serving, so one logged-in
    # user can't download another user's exported file by guessing/enumerating names.
    expected_prefix = f"booking_history_user_{session['user_id']}_"
    if not filename.startswith(expected_prefix):
        return jsonify({"error": "Forbidden"}), 403
    return send_from_directory(Config.EXPORTS_DIR, filename, as_attachment=True)
