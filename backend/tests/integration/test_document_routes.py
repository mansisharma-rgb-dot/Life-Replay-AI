import io
import os
import pytest
from app import create_app
from app.extensions import db
from app.models import User, DocumentMemory
from flask_jwt_extended import create_access_token
import pypdf

def build_pdf(pages_text):
    buf = io.BytesIO()
    buf.write(b'%PDF-1.4\n')
    offsets = {}
    
    def write_obj(obj_num, data):
        offsets[obj_num] = buf.tell()
        buf.write(f'{obj_num} 0 obj\n'.encode() + data + b'\nendobj\n')
        
    num_pages = len(pages_text)
    write_obj(1, b'<</Type /Catalog /Pages 2 0 R>>')
    kids = ' '.join(f'{3+i*2} 0 R' for i in range(num_pages))
    write_obj(2, f'<</Type /Pages /Kids [{kids}] /Count {num_pages}>>'.encode())
    
    font_id = 3 + num_pages * 2
    for i, txt in enumerate(pages_text):
        page_id = 3 + i * 2
        content_id = 4 + i * 2
        stream = f'BT\n/F1 12 Tf\n50 700 Td\n({txt}) Tj\nET'.encode()
        write_obj(page_id, f'<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {content_id} 0 R /Resources <</Font <</F1 {font_id} 0 R>>>>>>'.encode())
        write_obj(content_id, f'<</Length {len(stream)}>>\nstream\n'.encode() + stream + b'\nendstream')
        
    write_obj(font_id, b'<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>')
    
    xref_offset = buf.tell()
    total_objs = font_id + 1
    buf.write(f'xref\n0 {total_objs}\n0000000000 65535 f \n'.encode())
    for i in range(1, total_objs):
        buf.write(f'{offsets[i]:010d} 00000 n \n'.encode())
    buf.write(f'trailer\n<</Size {total_objs} /Root 1 0 R>>\nstartxref\n{xref_offset}\n%%EOF\n'.encode())
    
    return buf.getvalue()

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
def auth_headers(app):
    u = User(full_name='Doc User', email='docuser@example.com')
    u.set_password('test')
    db.session.add(u)
    db.session.commit()
    
    access_token = create_access_token(identity=str(u.id))
    return {'Authorization': f'Bearer {access_token}'}, u.id

def test_upload_text_pdf_success(client, auth_headers):
    headers, user_id = auth_headers
    pdf_bytes = build_pdf(['Life Replay PDF Extraction Test - Personal Growth and Daily Checkins'])
    
    data = {
        'file': (io.BytesIO(pdf_bytes), 'growth_notes.pdf')
    }
    
    res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data['document']['status'] == 'processed'
    assert 'extracted_text' in res_data['document']
    assert 'Life Replay PDF Extraction Test' in res_data['document']['extracted_text']

def test_upload_multi_page_pdf_success(client, auth_headers):
    headers, user_id = auth_headers
    pdf_bytes = build_pdf([
        'Life Replay Page One Overview and AI Memory',
        'Life Replay Page Two Productivity and Goals'
    ])
    
    data = {
        'file': (io.BytesIO(pdf_bytes), 'multipage_report.pdf')
    }
    
    res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    extracted = res_data['document']['extracted_text']
    assert 'Page One' in extracted
    assert 'Page Two' in extracted

def test_upload_txt_file_success(client, auth_headers):
    headers, user_id = auth_headers
    txt_content = b'This is a plain text document for Life Replay knowledge memories.'
    
    data = {
        'file': (io.BytesIO(txt_content), 'notes.txt')
    }
    
    res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data['document']['status'] == 'processed'
    assert 'plain text document' in res_data['document']['extracted_text']

def test_upload_empty_pdf(client, auth_headers):
    headers, user_id = auth_headers
    # PDF writer with 0 pages
    writer = pypdf.PdfWriter()
    buf = io.BytesIO()
    writer.write(buf)
    
    data = {
        'file': (io.BytesIO(buf.getvalue()), 'empty.pdf')
    }
    
    res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 400
    assert 'empty' in res.get_json()['error'].lower()

def test_upload_scanned_image_only_pdf(client, auth_headers):
    headers, user_id = auth_headers
    # PDF with blank page (no text layer)
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)
    
    data = {
        'file': (io.BytesIO(buf.getvalue()), 'scanned_scan.pdf')
    }
    
    res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 400
    error_msg = res.get_json()['error']
    assert 'scanned' in error_msg.lower() or 'no readable text' in error_msg.lower()

def test_upload_corrupted_pdf(client, auth_headers):
    headers, user_id = auth_headers
    corrupted_bytes = b'%PDF-1.4 completely corrupted content not a valid stream'
    
    data = {
        'file': (io.BytesIO(corrupted_bytes), 'corrupt.pdf')
    }
    
    res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 400
    assert 'damaged or corrupted' in res.get_json()['error']

def test_document_user_isolation(client, app, auth_headers):
    headers1, user1_id = auth_headers
    pdf_bytes = build_pdf(['User 1 Private Financial Document'])
    
    res = client.post('/api/documents/', headers=headers1, data={'file': (io.BytesIO(pdf_bytes), 'private.pdf')}, content_type='multipart/form-data')
    doc_id = res.get_json()['document']['id']
    
    # Create User 2
    with app.app_context():
        u2 = User(full_name='User Two', email='user2_doc@example.com')
        u2.set_password('test')
        db.session.add(u2)
        db.session.commit()
        u2_id = u2.id
        
    token2 = create_access_token(identity=str(u2_id))
    headers2 = {'Authorization': f'Bearer {token2}'}
    
    # User 2 list documents - should be empty
    list_res = client.get('/api/documents/', headers=headers2)
    assert len(list_res.get_json()) == 0
    
    # User 2 get document by id - 404
    get_res = client.get(f'/api/documents/{doc_id}', headers=headers2)
    assert get_res.status_code == 404
    
    # User 2 delete document - 404
    del_res = client.delete(f'/api/documents/{doc_id}', headers=headers2)
    assert del_res.status_code == 404

def test_get_document_and_delete(client, auth_headers):
    headers, user_id = auth_headers
    pdf_bytes = build_pdf(['Life Replay Document Lifecycle Test'])
    
    res = client.post('/api/documents/', headers=headers, data={'file': (io.BytesIO(pdf_bytes), 'lifecycle.pdf')}, content_type='multipart/form-data')
    doc_id = res.get_json()['document']['id']
    
    # Get by ID
    get_res = client.get(f'/api/documents/{doc_id}', headers=headers)
    assert get_res.status_code == 200
    doc_data = get_res.get_json()
    assert doc_data['original_name'] == 'lifecycle.pdf'
    assert 'Lifecycle Test' in doc_data['extracted_text']
    
    # Delete
    del_res = client.delete(f'/api/documents/{doc_id}', headers=headers)
    assert del_res.status_code == 200
    
    # Verify deleted
    get_res2 = client.get(f'/api/documents/{doc_id}', headers=headers)
    assert get_res2.status_code == 404
