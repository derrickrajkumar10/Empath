from transformers import pipeline

suggestion_pipeline = None

# Maps engagement state → action code for the frontend
ACTION_MAP = {
    "confused": "slow_video",
    "bored": "speed_up",
    "distressed": "show_break",
    "neutral": "nudge",
    "focused": "none"
}


def load_model():
    global suggestion_pipeline
    suggestion_pipeline = pipeline(
        "text2text-generation",
        model="google/flan-t5-base",
        max_new_tokens=80,
        device="cpu"  # CPU-only PyTorch in empath conda env
    )


def generate_suggestion(engagement_state: str, topic: str) -> dict:
    prompt = (
        f"A student is watching a video lesson about {topic}. "
        f"They appear {engagement_state}. "
        f"Write one friendly sentence to help them re-engage."
    )

    result = suggestion_pipeline(prompt)[0]["generated_text"]
    action = ACTION_MAP.get(engagement_state, "nudge")

    return {
        "suggestion": result.strip(),
        "action": action
    }
