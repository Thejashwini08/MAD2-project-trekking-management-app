from flask import Blueprint, request, jsonify
from models import Trek
from routes.decorators import login_required
from cache_utils import cache_get, cache_set

trek_bp = Blueprint("trek", __name__)


@trek_bp.route("", methods=["GET"])
@login_required()
def list_open_treks():
    difficulty = request.args.get("difficulty", "")
    location = request.args.get("location", "")
    duration = request.args.get("duration", "")

    cache_key = f"treks:open:{difficulty}:{location}:{duration}"
    cached = cache_get(cache_key)
    if cached is not None:
        return jsonify(cached)

    query = Trek.query.filter_by(status="Open")
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if location:
        query = query.filter(Trek.location.like(f"%{location}%"))
    if duration:
        try:
            query = query.filter_by(duration=int(duration))
        except (ValueError, TypeError):
            pass  # ignore invalid duration filter instead of crashing

    treks = [t.to_dict() for t in query.all()]
    cache_set(cache_key, treks, ex=60)   # cache for 60 seconds
    return jsonify(treks)


@trek_bp.route("/<int:trek_id>", methods=["GET"])
@login_required()
def trek_detail(trek_id):
    cache_key = f"treks:detail:{trek_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return jsonify(cached)

    trek = Trek.query.get(trek_id)
    if trek is None:
        return jsonify({"error": "Trek not found"}), 404

    data = trek.to_dict()
    cache_set(cache_key, data, ex=60)
    return jsonify(data)
