import json
import redis
from config import Config

try:
    redis_client = redis.Redis(
        host=Config.REDIS_HOST,
        port=Config.REDIS_PORT,
        db=Config.REDIS_DB,
        decode_responses=True,
        socket_connect_timeout=1,
    )
    redis_client.ping()
except Exception:
    redis_client = None


def cache_get(key):
    """Return cached value for key, or None if not cached / Redis unavailable."""
    if redis_client is None:
        return None
    try:
        value = redis_client.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


def cache_set(key, value, ex=60):
    """Cache value under key with expiry (seconds). Silently no-ops if Redis is down."""
    if redis_client is None:
        return
    try:
        redis_client.set(key, json.dumps(value), ex=ex)
    except Exception:
        pass


def cache_delete_prefix(prefix):
    """Invalidate all cache keys starting with prefix (used after treks change)."""
    if redis_client is None:
        return
    try:
        for key in redis_client.scan_iter(f"{prefix}*"):
            redis_client.delete(key)
    except Exception:
        pass
