import axios from 'axios'

const BASE = 'http://localhost:8000/api'

export async function checkHealth() {
  const { data } = await axios.get(`${BASE}/health`)
  return data  // { models_ready: bool }
}

export async function startSession(studentId, videoId, topic) {
  const { data } = await axios.post(`${BASE}/start-session`, null, {
    params: { student_id: studentId, video_id: videoId, topic }
  })
  return data  // { session_id: string }
}

export async function analyzeEmotion(imageBlob) {
  const form = new FormData()
  form.append('file', imageBlob, 'frame.jpg')
  const { data } = await axios.post(`${BASE}/analyze-emotion`, form)
  return data  // { emotion, confidence, phone_detected, distractions }
}

export async function sendBehaviorEvent(sessionId, timestampSeconds, eventType) {
  await axios.post(`${BASE}/behavior-event`, {
    session_id: sessionId,
    timestamp_seconds: timestampSeconds,
    event_type: eventType,
  })
}

export async function computeScore(sessionId, emotion, confidence, recentEvents, timestampSeconds) {
  const { data } = await axios.post(`${BASE}/compute-score`, {
    session_id: sessionId,
    emotion,
    confidence,
    recent_events: recentEvents,
    timestamp_seconds: timestampSeconds,
  })
  return data  // { focus_score, engagement_state }
}

export async function getSuggestion(sessionId, engagementState, topic, timestampSeconds) {
  const { data } = await axios.post(`${BASE}/get-suggestion`, {
    session_id: sessionId,
    engagement_state: engagementState,
    topic,
    timestamp_seconds: timestampSeconds,
  })
  return data  // { suggestion, action }
}

export async function getSessionReport(sessionId) {
  const { data } = await axios.get(`${BASE}/session-report/${sessionId}`)
  return data
}

export async function endSession(sessionId) {
  await axios.post(`${BASE}/end-session/${sessionId}`)
}
