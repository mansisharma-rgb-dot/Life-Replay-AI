import pytest
from app.services.correlation_service import CorrelationService

def test_pearson_perfect_positive():
    data = [(1, 2), (2, 4), (3, 6), (4, 8), (5, 10)]
    r = CorrelationService._calculate_pearson(data)
    assert r == 1.0

def test_pearson_perfect_negative():
    data = [(1, 10), (2, 8), (3, 6), (4, 4), (5, 2)]
    r = CorrelationService._calculate_pearson(data)
    assert r == -1.0

def test_pearson_insufficient_data():
    data = [(1, 2), (2, 4), (3, 6), (4, 8)]
    r = CorrelationService._calculate_pearson(data)
    assert r is None

def test_interpret_insufficient():
    assert CorrelationService._interpret(None, "A", "B") == "Insufficient data to determine a relationship."

def test_interpret_strong_positive():
    r = CorrelationService._interpret(0.8, "Sleep", "Mood")
    assert "Strong positive" in r
    assert "Sleep" in r
    assert "Mood" in r

def test_interpret_moderate_negative():
    r = CorrelationService._interpret(-0.4, "Stress", "Energy")
    assert "Moderate negative" in r
    assert "Stress" in r
    assert "Energy" in r
    
def test_interpret_weak():
    r = CorrelationService._interpret(0.1, "A", "B")
    assert "Weak or no measurable" in r
