from transformers import pipeline
from PIL import Image
import io

distraction_pipeline = None

# COCO objects that indicate the student is distracted
DISTRACTION_OBJECTS = {"cell phone", "remote", "book"}


def load_model():
    global distraction_pipeline
    distraction_pipeline = pipeline(
        "object-detection",
        model="facebook/detr-resnet-50",
        device="cpu"  # CPU-only PyTorch in empath conda env
    )


def detect_distractions(image_bytes: bytes) -> dict:
    """
    Runs DETR object detection on a webcam frame.
    Returns phone_detected flag and list of distraction objects found.
    Threshold: 0.75 confidence to reduce false positives.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = distraction_pipeline(image)

    detected = [
        r["label"].lower()
        for r in results
        if r["score"] > 0.75
    ]

    phone_detected = "cell phone" in detected
    distractions_found = [d for d in detected if d in DISTRACTION_OBJECTS]

    return {
        "phone_detected": phone_detected,
        "distractions": distractions_found
    }
