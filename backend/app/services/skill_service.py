from app.extensions import db
from app.models.skill import Skill

class SkillService:
    @staticmethod
    def get_user_skills(user_id):
        skills = Skill.query.filter_by(user_id=user_id).order_by(Skill.updated_at.desc()).all()
        return skills

    @staticmethod
    def add_skill(user_id, data):
        new_skill = Skill(
            user_id=user_id,
            name=data['name'],
            category=data['category']
        )
        db.session.add(new_skill)
        db.session.commit()
        return new_skill

    @staticmethod
    def update_skill(user_id, skill_id, data):
        skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first()
        if not skill:
            return None, 404

        if 'name' in data:
            skill.name = data['name']
        if 'category' in data:
            skill.category = data['category']
        if 'progress' in data:
            skill.progress = data['progress']
            # Level up logic if progress >= 100
            while skill.progress >= 100.0:
                skill.level += 1
                skill.progress -= 100.0

        db.session.commit()
        return skill, 200

    @staticmethod
    def delete_skill(user_id, skill_id):
        skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first()
        if not skill:
            return False, 404
        
        db.session.delete(skill)
        db.session.commit()
        return True, 200
