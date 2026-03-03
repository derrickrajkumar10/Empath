from transformers import pipeline
from PIL import Image
import io

# Loaded once at startup — stored as module-level global
emotion_pipeline = None


def load_model():
    global emotion_pipeline
    emotion_pipeline = pipeline(
        "image-classification",
        model="dima806/facial_emotions_image_detection",
        device="cpu"  # CPU-only PyTorch in empath conda env
    )


def analyze_frame(image_bytes: bytes) -> dict:
    """
    Takes raw JPEG bytes from webcam frame.
    Returns { emotion: str, confidence: float }
    Maps dima806 model labels to our 5 engagement states.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = emotion_pipeline(image)
    top = results[0]

    # Map dima806 output labels → our 5 engagement states
    # "confused" is reached via frustration (angry) — studying-specific interpretation
    label_map = {
        "happy":    "focused",    # engaged, enjoying content
        "surprise": "neutral",    # momentary surprise ≠ focused
        "neutral":  "neutral",    # calm, attentive
        "fear":     "distressed", # genuinely overwhelmed
        "sad":      "neutral",    # serious/concentrated face, not distressed
        "disgust":  "bored",      # disengaged
        "angry":    "confused",   # frustration when learning = confused
        "contempt": "neutral",    # skeptical but still watching
    }

    raw_label = top["label"].lower()
    emotion = label_map.get(raw_label, "neutral")

    # Low-confidence predictions are unreliable — fall back to neutral
    if top["score"] < 0.40:
        emotion = "neutral"

    return {
        "emotion": emotion,
        "confidence": round(top["score"], 3)
    }
