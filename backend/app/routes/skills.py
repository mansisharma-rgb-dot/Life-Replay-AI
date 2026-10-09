from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.skill_schemas import SkillSchema, SkillUpdateSchema
from app.services.skill_service import SkillService

skills_bp = Blueprint('skills', __name__)
schema = SkillSchema()
update_schema = SkillUpdateSchema()
list_schema = SkillSchema(many=True)

@skills_bp.route('/', methods=['GET'])
@jwt_required()
def get_skills():
    user_id = get_jwt_identity()
    skills = SkillService.get_user_skills(user_id)
    return jsonify(list_schema.dump(skills)), 200

@skills_bp.route('/', methods=['POST'])
@jwt_required()
def add_skill():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    try:
        validated = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    new_skill = SkillService.add_skill(user_id, validated)
    return jsonify({'success': True, 'skill': schema.dump(new_skill)}), 201

@skills_bp.route('/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    try:
        validated = update_schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    updated_skill, status = SkillService.update_skill(user_id, skill_id, validated)
    if status == 404:
        return jsonify({'success': False, 'error': 'Skill not found'}), 404
        
    return jsonify({'success': True, 'skill': schema.dump(updated_skill)}), 200

@skills_bp.route('/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    user_id = get_jwt_identity()
    success, status = SkillService.delete_skill(user_id, skill_id)
    if not success:
        return jsonify({'success': False, 'error': 'Skill not found'}), 404
        
    return jsonify({'success': True}), 200
