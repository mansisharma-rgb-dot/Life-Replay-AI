import pytest
import json
from unittest.mock import patch, MagicMock
from app.services.llm_service import LLMService

def test_llm_service_fallback_no_api_key(monkeypatch):
    # Ensure OPENAI_API_KEY is not set
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    
    context = {"period": {"days": 30}}
    result = LLMService.generate_life_replay(context)
    
    assert "vibe" in result
    assert "triumphs" in result
    assert "friction" in result
    assert "summary" in result
    assert "OPENAI_API_KEY" not in result["summary"]
    assert len(result["summary"]) > 10
    assert result.get("source") == "local"

@patch('app.services.llm_service.OpenAI')
def test_llm_service_with_api_key(mock_openai, monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'fake_key')
    
    # Mock the response structure
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content=json.dumps({
            "vibe": {"title": "Test Vibe", "description": "Desc"},
            "triumphs": [{"title": "Win", "description": "Win desc"}],
            "friction": {"title": "Loss", "description": "Loss desc"},
            "summary": "Great summary"
        })))
    ]
    
    mock_client_instance = mock_openai.return_value
    mock_client_instance.chat.completions.create.return_value = mock_response
    
    context = {"period": {"days": 30}}
    result = LLMService.generate_life_replay(context)
    
    assert result["vibe"]["title"] == "Test Vibe"
    assert result["summary"] == "Great summary"
    
    mock_client_instance.chat.completions.create.assert_called_once()
