from pydantic import BaseModel
from typing import List


class BehaviorEventRequest(BaseModel):
    session_id: str
    event_type: str  # pause | rewind | fast_forward | idle_start | idle_end | play
    timestamp_seconds: float


class ComputeScoreRequest(BaseModel):
    session_id: str
    emotion: str
    confidence: float
    recent_events: List[str]
    timestamp_seconds: float  # used to persist emotion event with correct video time


class SuggestionRequest(BaseModel):
    session_id: str
    engagement_state: str
    topic: str
    timestamp_seconds: float


class EmotionResponse(BaseModel):
    emotion: str
    confidence: float
    phone_detected: bool = False
    distractions: List[str] = []


class ScoreResponse(BaseModel):
    focus_score: int
    engagement_state: str


class SuggestionResponse(BaseModel):
    suggestion: str
    action: str  # slow_video | speed_up | show_quiz | show_break | nudge | none
