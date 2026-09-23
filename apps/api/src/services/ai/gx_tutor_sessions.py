import json
import logging

import redis
from config.config import get_learnhouse_config

logger = logging.getLogger(__name__)


def validate_activity_chat_session_ownership(
    aichat_uuid: str,
    user_id: int,
    course_uuid: str,
    org_id: int,
) -> bool:
    """Validate GX Tutor session ownership and tenant/course binding.

    Activity chat continuation fails closed unless Redis metadata exists and
    matches the authenticated user, course, and organization.
    """
    try:
        config = get_learnhouse_config()
        connection_string = config.redis_config.redis_connection_string
        if not connection_string:
            return False

        client = redis.from_url(
            connection_string,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        meta_data = client.get(f"chat_meta:{aichat_uuid}")
        if not meta_data:
            return False

        if isinstance(meta_data, bytes):
            meta_data = meta_data.decode("utf-8")

        meta = json.loads(meta_data)
        return (
            meta.get("user_id") == user_id
            and meta.get("course_uuid") == course_uuid
            and meta.get("org_id") == org_id
        )
    except (
        AttributeError,
        TypeError,
        UnicodeDecodeError,
        ValueError,
        json.JSONDecodeError,
        redis.RedisError,
    ):
        logger.exception("Failed to validate GX Tutor session ownership")
        return False
