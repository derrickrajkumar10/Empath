from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from models import emotion_model, suggestion_model, distraction_model
from services import scoring, session as session_service
from schemas.schemas import (
    BehaviorEventRequest, ComputeScoreRequest,
    SuggestionRequest, EmotionResponse, ScoreResponse, SuggestionResponse
)

models_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global models_ready
    print("Loading HuggingFace models... (20-30s on first run)")
    emotion_model.load_model()
    suggestion_model.load_model()
    distraction_model.load_model()
    models_ready = True
    print("Models ready.")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"models_ready": models_ready}


@app.post("/api/start-session")
def start_session(
    student_id: str = "student_001",
    video_id: str = "video_001",
    topic: str = "General"
):
    session_id = session_service.create_session(student_id, video_id, topic)
    return {"session_id": session_id}


@app.post("/api/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion(file: UploadFile = File(...)):
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading")
    image_bytes = await file.read()
    result = emotion_model.analyze_frame(image_bytes)
    distraction_result = distraction_model.detect_distractions(image_bytes)
    result.update(distraction_result)
    return result


@app.post("/api/behavior-event")
def behavior_event(req: BehaviorEventRequest):
    session_service.save_behavior_event(
        req.session_id, req.timestamp_seconds, req.event_type
    )
    return {"received": True}


@app.post("/api/compute-score", response_model=ScoreResponse)
def compute_score(req: ComputeScoreRequest):
    result = scoring.compute_focus_score(req.emotion, req.recent_events)
    session_service.save_emotion_event(
        req.session_id,
        req.timestamp_seconds,  # Fixed: was hardcoded 0 in original spec
        req.emotion,
        req.confidence,
        result["focus_score"]
    )
    return result


@app.post("/api/get-suggestion", response_model=SuggestionResponse)
def get_suggestion(req: SuggestionRequest):
    result = suggestion_model.generate_suggestion(req.engagement_state, req.topic)
    session_service.save_suggestion(
        req.session_id,
        req.timestamp_seconds,
        req.engagement_state,
        result["suggestion"],
        result["action"]
    )
    return result


@app.get("/api/session-report/{session_id}")
def session_report(session_id: str):
    return session_service.get_session_report(session_id)


@app.post("/api/end-session/{session_id}")
def end_session(session_id: str):
    session_service.end_session(session_id)
    return {"ended": True}
