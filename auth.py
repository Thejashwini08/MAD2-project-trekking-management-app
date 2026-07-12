from flask import Blueprint, request, session, jsonify
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Only Trekkers (users) can self-register. Admin and Staff accounts are created separately."""
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    contact = data.get("contact", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    user = User(name=name, email=email, contact=contact, role="user", status="Approved")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration successful. Please log in."}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Unified login for Admin, Trek Staff and Users."""
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.status == "Blacklisted":
        return jsonify({"error": "Your account has been blacklisted. Contact admin."}), 403

    session["user_id"] = user.id
    session["role"] = user.role
    session["name"] = user.name

    return jsonify({"user": user.to_dict()})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return jsonify({"user": None})
    user = User.query.get(session["user_id"])
    if user is None:
        session.clear()
        return jsonify({"user": None})
    return jsonify({"user": user.to_dict()})
