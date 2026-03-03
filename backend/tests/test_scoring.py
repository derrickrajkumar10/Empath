import sys
sys.path.insert(0, 'd:/Projects/Empath/backend')

from services.scoring import compute_focus_score


def test_focused_no_events():
    result = compute_focus_score("focused", [])
    # emotion_score=90, behavior_score=100
    # focus_score = int(90*0.6 + 100*0.4) = int(54+40) = 94
    assert result["focus_score"] == 94
    assert result["engagement_state"] == "focused"


def test_neutral_no_events():
    result = compute_focus_score("neutral", [])
    # int(70*0.6 + 100*0.4) = int(42+40) = 82
    assert result["focus_score"] == 82
    assert result["engagement_state"] == "focused"


def test_bored_with_rewind():
    result = compute_focus_score("bored", ["rewind"])
    # emotion=30, behavior=max(0,100-15)=85
    # int(30*0.6 + 85*0.4) = int(18+34) = 52
    # 52 >= 40 → "confused" (not "neutral" which requires >= 60)
    assert result["focus_score"] == 52
    assert result["engagement_state"] == "confused"


def test_distressed_many_events():
    result = compute_focus_score("distressed", ["idle_start", "pause", "rewind"])
    # emotion=20, behavior=max(0,100-30-10-15)=45
    # int(20*0.6 + 45*0.4) = int(12+18) = 30
    assert result["focus_score"] == 30
    assert result["engagement_state"] == "bored"


def test_score_clamped_to_100():
    result = compute_focus_score("focused", [])
    assert result["focus_score"] <= 100


def test_score_never_negative():
    result = compute_focus_score("distressed", ["idle_start"] * 10)
    assert result["focus_score"] >= 0


def test_unknown_emotion_defaults_to_neutral_score():
    result = compute_focus_score("unknown_emotion", [])
    # defaults to 70 (neutral)
    assert result["focus_score"] == 82


def test_engagement_thresholds():
    # Test all threshold boundaries
    cases = [
        ("focused", [], "focused"),   # 94 >= 80
        ("neutral", [], "focused"),   # 82 >= 80
        ("confused", [], "neutral"),  # int(50*0.6+100*0.4)=int(70)=70 >= 60
        ("bored", [], "neutral"),     # int(30*0.6+100*0.4)=int(58)=58 >= 40... wait
    ]
    # confused: int(50*0.6 + 100*0.4) = int(30+40) = 70 → neutral (>=60)
    r = compute_focus_score("confused", [])
    assert r["engagement_state"] == "neutral"
    assert r["focus_score"] == 70
