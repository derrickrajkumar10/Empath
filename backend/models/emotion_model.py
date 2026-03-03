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
    label_map = {
        "happy": "focused",
        "surprise": "focused",
        "neutral": "neutral",
        "fear": "distressed",
        "sad": "distressed",
        "disgust": "bored",
        "angry": "distressed",
        "contempt": "bored"
    }

    raw_label = top["label"].lower()
    emotion = label_map.get(raw_label, "neutral")

    return {
        "emotion": emotion,
        "confidence": round(top["score"], 3)
    }
