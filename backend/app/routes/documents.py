from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.document_service import DocumentService

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/', methods=['GET'])
@jwt_required()
def get_documents():
    user_id = get_jwt_identity()
    docs = DocumentService.get_user_documents(user_id)
    return jsonify(docs), 200

@documents_bp.route('/', methods=['POST'])
@jwt_required()
def upload_document():
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    result, status_code = DocumentService.process_upload(user_id, file, current_app.instance_path)
    return jsonify(result), status_code

@documents_bp.route('/<int:doc_id>', methods=['GET'])
@jwt_required()
def get_document(doc_id):
    user_id = get_jwt_identity()
    result, status_code = DocumentService.get_document(user_id, doc_id)
    return jsonify(result), status_code

@documents_bp.route('/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    user_id = get_jwt_identity()
    result, status_code = DocumentService.delete_document(user_id, doc_id, current_app.instance_path)
    return jsonify(result), status_code
