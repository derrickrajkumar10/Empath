from database.db import supabase
from datetime import datetime, timezone


def create_session(student_id: str, video_id: str, topic: str) -> str:
    result = supabase.table("sessions").insert({
        "student_id": student_id,
        "video_id": video_id,
        "topic": topic
    }).execute()
    return result.data[0]["id"]


def save_emotion_event(session_id, timestamp_seconds, emotion, confidence, focus_score):
    supabase.table("emotion_events").insert({
        "session_id": session_id,
        "timestamp_seconds": timestamp_seconds,
        "emotion": emotion,
        "confidence": confidence,
        "focus_score": focus_score
    }).execute()


def save_behavior_event(session_id, timestamp_seconds, event_type):
    supabase.table("behavior_events").insert({
        "session_id": session_id,
        "timestamp_seconds": timestamp_seconds,
        "event_type": event_type
    }).execute()


def save_suggestion(session_id, timestamp_seconds, engagement_state, suggestion_text, action):
    supabase.table("suggestions").insert({
        "session_id": session_id,
        "timestamp_seconds": timestamp_seconds,
        "engagement_state": engagement_state,
        "suggestion_text": suggestion_text,
        "action": action
    }).execute()


def get_session_report(session_id: str) -> dict:
    emotions = supabase.table("emotion_events") \
        .select("*").eq("session_id", session_id) \
        .order("timestamp_seconds").execute().data

    behaviors = supabase.table("behavior_events") \
        .select("*").eq("session_id", session_id) \
        .order("timestamp_seconds").execute().data

    suggestions = supabase.table("suggestions") \
        .select("*").eq("session_id", session_id) \
        .order("timestamp_seconds").execute().data

    avg_score = (
        sum(e["focus_score"] for e in emotions) / len(emotions)
        if emotions else 0
    )

    emotion_counts = {}
    for e in emotions:
        emotion_counts[e["emotion"]] = emotion_counts.get(e["emotion"], 0) + 1

    return {
        "session_id": session_id,
        "average_focus_score": round(avg_score, 1),
        "emotion_distribution": emotion_counts,
        "focus_timeline": [
            {"t": e["timestamp_seconds"], "score": e["focus_score"], "emotion": e["emotion"]}
            for e in emotions
        ],
        "behavior_events": behaviors,
        "suggestions_given": suggestions,
        "total_events": len(behaviors)
    }


def end_session(session_id: str):
    supabase.table("sessions").update({
        "ended_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()
