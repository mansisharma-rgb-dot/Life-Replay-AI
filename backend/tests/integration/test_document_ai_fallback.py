import pytest
import os
import json
from unittest.mock import patch
from app import create_app
from app.models import User
from app.models.document_memory import DocumentMemory
from app.services.document_service import DocumentService
from app.extensions import db
from flask_jwt_extended import create_access_token

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def test_user(app):
    with app.app_context():
        user = User(full_name='testuser', email='test@test.com')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()
        return user.id

@pytest.fixture
def test_user_id(test_user):
    return test_user

@pytest.fixture
def auth_headers(app, test_user):
    with app.app_context():
        access_token = create_access_token(identity=str(test_user))
        return {
            'Authorization': f'Bearer {access_token}'
        }

def test_document_fallback_without_api_key(client, test_user_id, auth_headers):
    # Ensure OPENAI_API_KEY is not set
    with patch.dict(os.environ, clear=True):
        if 'OPENAI_API_KEY' in os.environ:
            del os.environ['OPENAI_API_KEY']

        import io
        test_file = (io.BytesIO(b"Hello world. This is a text file. It should be extracted and have a deterministic fallback. Let's make it slightly longer so it has some words."), 'test.txt')
        
        data = {
            'file': test_file
        }
        
        response = client.post('/api/documents/', headers=auth_headers, data=data, content_type='multipart/form-data')
        
        assert response.status_code == 200
        json_data = response.get_json()
        assert "message" in json_data
        
        doc = json_data['document']
        assert doc['status'] == 'processed'
        assert doc['is_local_summary'] == True
        assert "Local Summary" in doc['key_topics']
        assert "Document processed successfully" in doc['summary']
        assert "26 words" in doc['summary']
        assert "Hello world" in doc['summary']

def test_document_summary_with_api_key(client, test_user_id, auth_headers):
    # Provide a mock API key
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'fake_key'}):
        with patch('app.services.llm_service.OpenAI') as MockOpenAI:
            mock_client = MockOpenAI.return_value
            mock_response = mock_client.chat.completions.create.return_value
            mock_response.choices[0].message.content = json.dumps({
                "title": "Mock AI Title",
                "summary": "This is a beautiful AI generated summary.",
                "key_topics": ["AI", "Summary", "Test"]
            })
            
            import io
            test_file = (io.BytesIO(b"Another text file to test AI pipeline."), 'test_ai.txt')
            
            data = {
                'file': test_file
            }
            
            response = client.post('/api/documents/', headers=auth_headers, data=data, content_type='multipart/form-data')
            
            assert response.status_code == 200
            json_data = response.get_json()
            doc = json_data['document']
            assert doc['is_local_summary'] == False
            assert doc['summary'] == "This is a beautiful AI generated summary."
            assert "AI" in doc['key_topics']

def test_existing_document_with_error_summary_sanitization(app, client, test_user_id, auth_headers):
    # Simulate an existing bad document in DB
    doc = DocumentMemory(
        user_id=test_user_id,
        filename='legacy.pdf',
        original_name='legacy.pdf',
        file_type='pdf',
        file_size=1024,
        title='Legacy Document',
        summary='This document was successfully extracted. (AI summary unavailable without OPENAI_API_KEY)',
        key_topics='["Local Processing"]',
        extracted_text='Legacy extracted text that should be shown in fallback.',
        status='processed'
    )
    db.session.add(doc)
    db.session.commit()
    
    doc_id = doc.id
    
    # Retrieve it
    response = client.get(f'/api/documents/{doc_id}', headers=auth_headers)
    assert response.status_code == 200
    json_data = response.get_json()
    
    assert json_data['is_local_summary'] == True
    assert "Document processed successfully" in json_data['summary']
    assert "Legacy extracted text that should be shown in fallback." in json_data['summary']
    assert "OPENAI_API_KEY" not in json_data['summary']
    
def test_ai_health_endpoint(client):
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'fake_key'}):
        response = client.get('/api/health/ai')
        assert response.status_code == 200
        assert response.get_json()['openai_configured'] == True
        
    with patch.dict(os.environ, clear=True):
        if 'OPENAI_API_KEY' in os.environ:
            del os.environ['OPENAI_API_KEY']
        response = client.get('/api/health/ai')
        assert response.status_code == 200
        assert response.get_json()['openai_configured'] == False
