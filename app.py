import os
from flask import Flask, request
from extensions import db
from config import Config, BASE_DIR

FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")


def create_app():
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.config.from_object(Config)
    app.secret_key = app.config["SECRET_KEY"]

    db.init_app(app)

    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.staff import staff_bp
    from routes.user import user_bp
    from routes.trek import trek_bp
    from routes.booking import booking_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(trek_bp, url_prefix="/api/treks")
    app.register_blueprint(booking_bp, url_prefix="/api/bookings")

    with app.app_context():
        db.create_all()
        seed_admin()

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    # SPA fallback: any non-API, non-static path serves index.html so Vue Router can handle it
    @app.errorhandler(404)
    def spa_fallback(e):
        if request.path.startswith("/api/"):
            return {"error": "Not found"}, 404
        return app.send_static_file("index.html")

    return app


def seed_admin():
    """Admin is pre-created programmatically. No admin registration route exists."""
    from models import User
    admin = User.query.filter_by(email=Config.ADMIN_LOGIN_EMAIL).first()
    if admin is None:
        admin = User(
            name="Admin",
            email=Config.ADMIN_LOGIN_EMAIL,
            contact="9999999999",
            role="admin",
            status="Approved",
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
