import os
import io
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.document_memory import DocumentMemory
from app.services.llm_service import LLMService

class DocumentService:
    ALLOWED_EXTENSIONS = {'pdf', 'txt'}
    
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in DocumentService.ALLOWED_EXTENSIONS

    @staticmethod
    def process_upload(user_id, file, instance_path):
        if not file or not file.filename:
            return {"error": "No file selected"}, 400
            
        if not DocumentService.allowed_file(file.filename):
            return {"error": "Invalid file type. Only PDF and TXT are allowed."}, 400

        original_name = file.filename
        filename = secure_filename(file.filename)
        if not filename or filename == '.':
            import uuid
            file_ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else 'pdf'
            filename = f"upload_{uuid.uuid4().hex}.{file_ext}"
        else:
            file_ext = filename.rsplit('.', 1)[1].lower()
        
        # Ensure user directory exists
        user_dir = os.path.join(instance_path, 'uploads', str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        # Save file to disk
        file_path = os.path.join(user_dir, filename)
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create initial DB record
        doc_mem = DocumentMemory(
            user_id=user_id,
            filename=filename,
            original_name=original_name,
            file_type=file_ext,
            file_size=file_size,
            title=original_name,
            status='processing'
        )
        db.session.add(doc_mem)
        db.session.commit()
        
        # Extract Text
        extracted_text = ""
        # Strictly limit the amount of text extracted to prevent memory exhaustion 
        # before the LLM truncation phase. (100k characters is roughly 25k tokens).
        MAX_EXTRACTION_CHARS = 100000 
        
        try:
            if file_ext == 'txt':
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                        extracted_text = f.read(MAX_EXTRACTION_CHARS)
                except Exception as e:
                    doc_mem.status = 'error'
                    doc_mem.error_message = f"Failed to read text file: {str(e)}"
                    db.session.commit()
                    return {"error": "Failed to read text file. The file may be damaged or invalid.", "status": "error"}, 400
            elif file_ext == 'pdf':
                try:
                    import pypdf
                    extracted_parts = []
                    total_chars = 0
                    num_pages = 0
                    with open(file_path, 'rb') as f:
                        reader = pypdf.PdfReader(f)
                        num_pages = len(reader.pages)
                        for page_idx, page in enumerate(reader.pages):
                            if total_chars >= MAX_EXTRACTION_CHARS:
                                break
                            try:
                                page_text = page.extract_text()
                                if page_text:
                                    normalized = page_text.strip()
                                    if normalized:
                                        extracted_parts.append(normalized)
                                        total_chars += len(normalized)
                            except Exception:
                                continue
                                
                    extracted_text = "\n\n".join(extracted_parts)[:MAX_EXTRACTION_CHARS]
                    
                    if not extracted_text.strip():
                        doc_mem.status = 'error'
                        if num_pages == 0:
                            doc_mem.error_message = "PDF document is empty."
                            db.session.commit()
                            return {"error": "PDF document is empty.", "status": "error"}, 400
                        else:
                            doc_mem.error_message = "Text could not be extracted from this PDF because it contains scanned/image-only pages or has no readable text layer."
                            db.session.commit()
                            return {"error": "Text could not be extracted from this PDF because it contains scanned/image-only pages or has no readable text layer.", "status": "error"}, 400
                except Exception as e:
                    doc_mem.status = 'error'
                    doc_mem.error_message = f"Failed to parse PDF file. The file may be damaged or corrupted: {str(e)}"
                    db.session.commit()
                    return {"error": "Failed to parse PDF file. The file may be damaged or corrupted.", "status": "error"}, 400
                    
            if not extracted_text.strip():
                doc_mem.status = 'error'
                doc_mem.error_message = "Document is empty or contains no readable text."
                db.session.commit()
                return {"error": "Document is empty or contains no readable text.", "status": "error"}, 400
                
            doc_mem.extracted_text = extracted_text
            
            # Summarize via LLM
            # Ensure text is not too large for LLM
            max_chars = 15000 
            text_to_summarize = extracted_text[:max_chars]
            
            summary_result = LLMService.summarize_document(text_to_summarize, original_filename=original_name)
            
            doc_mem.summary = summary_result.get('summary', 'Document text extracted successfully.')
            doc_mem.title = summary_result.get('title') or original_name
            doc_mem.key_topics = summary_result.get('key_topics', ["Document", "Extracted"])
            doc_mem.status = 'processed'
            doc_mem.error_message = None
            db.session.commit()
            
            return {
                "message": "Document processed successfully",
                "document": DocumentService._sanitize_document_data(doc_mem)
            }, 200
            
        except Exception as e:
            doc_mem.status = 'error'
            doc_mem.error_message = f"Processing failed: {str(e)}"
            db.session.commit()
            return {"error": str(e), "status": "error"}, 500
            
    @staticmethod
    def _sanitize_document_data(doc):
        bad_strings = ["AI summary unavailable", "OPENAI_API_KEY", "Document Processed Locally", "Local Processing"]
        is_bad = doc.summary and any(b in doc.summary for b in bad_strings)
        is_empty = not doc.summary or doc.summary.strip() == ""
        
        is_local = False
        topics = doc.key_topics or []
        if isinstance(topics, str):
            try:
                import json
                topics = json.loads(topics)
            except Exception:
                topics = []
                
        if "Local Processing" in topics or "Document" in topics or "Local Summary" in topics or is_bad or is_empty:
            is_local = True

        summary = doc.summary or ""
        overview = ""
        key_points = []
        key_dates = []
        keywords = []
        
        extracted_text = doc.extracted_text or ""
        char_count = len(extracted_text)
        word_count = len(extracted_text.split())
        
        if is_bad or is_empty or is_local or not summary:
            # Generate or parse clean deterministic summary
            det_res = LLMService._deterministic_document_summary(extracted_text, original_filename=doc.original_name or doc.title)
            summary = det_res.get('summary', summary)
            overview = det_res.get('overview', '')
            topics = det_res.get('key_topics', topics or ["Local Summary"])
            key_points = det_res.get('key_points', [])
            key_dates = det_res.get('key_dates', [])
            keywords = det_res.get('keywords', [])
            is_local = True
        else:
            # For AI summaries, parse overview and points if present
            overview = summary
            if "\n" in summary:
                overview = summary.split("\n\n")[0].strip()

        return {
            "id": doc.id,
            "title": doc.title or doc.original_name,
            "original_name": doc.original_name,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "summary": summary,
            "summary_type": "local" if is_local else "ai",
            "is_local_summary": is_local,
            "overview": overview,
            "key_topics": topics if isinstance(topics, list) else ["Local Summary"],
            "key_points": key_points,
            "key_dates": key_dates,
            "keywords": keywords,
            "extracted_text": extracted_text,
            "extracted_chars": char_count,
            "extracted_words": word_count,
            "status": doc.status,
            "error_message": doc.error_message,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        }

    @staticmethod
    def get_user_documents(user_id):
        docs = DocumentMemory.query.filter_by(user_id=user_id).order_by(DocumentMemory.created_at.desc()).all()
        return [DocumentService._sanitize_document_data(d) for d in docs]

    @staticmethod
    def get_document(user_id, doc_id):
        doc = DocumentMemory.query.filter_by(id=doc_id, user_id=user_id).first()
        if not doc:
            return {"error": "Document not found"}, 404
        return DocumentService._sanitize_document_data(doc), 200
        
    @staticmethod
    def delete_document(user_id, doc_id, instance_path):
        doc = DocumentMemory.query.filter_by(id=doc_id, user_id=user_id).first()
        if not doc:
            return {"error": "Document not found"}, 404
            
        file_path = os.path.join(instance_path, 'uploads', str(user_id), doc.filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
            
        db.session.delete(doc)
        db.session.commit()
        return {"message": "Document deleted"}, 200
