EMOTION_SCORES = {
    "focused": 90,
    "neutral": 70,
    "confused": 50,
    "bored": 30,
    "distressed": 20
}

BEHAVIOR_PENALTIES = {
    "pause": -10,
    "rewind": -15,
    "fast_forward": -20,
    "idle_start": -30,
    "phone_detected": -40
}

ENGAGEMENT_THRESHOLDS = [
    (80, "focused"),
    (60, "neutral"),
    (40, "confused"),
    (20, "bored"),
    (0, "distressed")
]


def compute_focus_score(emotion: str, recent_events: list) -> dict:
    emotion_score = EMOTION_SCORES.get(emotion, 70)

    behavior_penalty = sum(
        BEHAVIOR_PENALTIES.get(event, 0)
        for event in recent_events
    )

    behavior_score = max(0, 100 + behavior_penalty)

    focus_score = int(
        (emotion_score * 0.6) + (behavior_score * 0.4)
    )
    focus_score = max(0, min(100, focus_score))

    engagement_state = "focused"
    for threshold, state in ENGAGEMENT_THRESHOLDS:
        if focus_score >= threshold:
            engagement_state = state
            break

    return {
        "focus_score": focus_score,
        "engagement_state": engagement_state
    }
