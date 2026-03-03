import sys
sys.path.insert(0, 'd:/Projects/Empath/backend')

from schemas.schemas import BehaviorEventRequest, ComputeScoreRequest, SuggestionRequest


def test_behavior_event_schema():
    req = BehaviorEventRequest(
        session_id="abc-123",
        event_type="pause",
        timestamp_seconds=10.5
    )
    assert req.event_type == "pause"
    assert req.timestamp_seconds == 10.5


def test_compute_score_schema_has_timestamp():
    req = ComputeScoreRequest(
        session_id="abc-123",
        emotion="neutral",
        confidence=0.85,
        recent_events=["pause"],
        timestamp_seconds=30.0
    )
    assert req.timestamp_seconds == 30.0


def test_suggestion_request_schema():
    req = SuggestionRequest(
        session_id="abc-123",
        engagement_state="confused",
        topic="Machine Learning",
        timestamp_seconds=60.0
    )
    assert req.engagement_state == "confused"
