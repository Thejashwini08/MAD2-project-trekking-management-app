from functools import wraps
from flask import session, jsonify


def login_required(role=None):
    """Restrict a route to logged-in users, optionally to a specific role."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "Not logged in"}), 401
            if role and session.get("role") != role:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
