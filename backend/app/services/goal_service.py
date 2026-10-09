from app.extensions import db
from app.models import Goal
from datetime import datetime

class GoalService:
    @staticmethod
    def get_goals(user_id):
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.created_at.desc()).all()
        return [GoalService._format_goal(g) for g in goals], 200

    @staticmethod
    def get_goal(user_id, goal_id):
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return {'success': False, 'error': 'Goal not found'}, 404
        return GoalService._format_goal(goal), 200

    @staticmethod
    def create_goal(user_id, data):
        goal = Goal(
            user_id=user_id,
            title=data.get('title'),
            progress=data.get('progress', 0.0),
            target=data.get('target', 100.0),
            category=data.get('category'),
            deadline=data.get('deadline'),
            status=data.get('status', 'active')
        )
        db.session.add(goal)
        db.session.commit()
        
        if goal.status == 'completed':
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "goal", f"goal:{goal.id}", 50, f"Completed Goal: {goal.title}")
            

        return GoalService._format_goal(goal), 201

    @staticmethod
    def update_goal(user_id, goal_id, data):
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return {'success': False, 'error': 'Goal not found'}, 404
        
        for key, value in data.items():
            if hasattr(goal, key):
                setattr(goal, key, value)
                
        # Auto-complete if progress reaches target
        if goal.progress >= goal.target and goal.status == 'active':
            goal.status = 'completed'
            
        if goal.status == 'completed':
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "goal", f"goal:{goal.id}", 50, f"Completed Goal: {goal.title}")
            # Award "Goal Crusher" achievement on first completed goal
            from app.services.achievement_service import AchievementService
            AchievementService.award_achievement(user_id, "goal_crusher")
            
        db.session.commit()
        return GoalService._format_goal(goal), 200

    @staticmethod
    def delete_goal(user_id, goal_id):
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return {'success': False, 'error': 'Goal not found'}, 404
            
        db.session.delete(goal)
        db.session.commit()
        return {'success': True, 'message': 'Goal deleted successfully'}, 200

    @staticmethod
    def _format_goal(goal):
        return {
            'id': goal.id,
            'title': goal.title,
            'progress': goal.progress,
            'target': goal.target,
            'category': goal.category,
            'deadline': goal.deadline.isoformat() if goal.deadline else None,
            'status': goal.status,
            'created_at': goal.created_at.isoformat() if goal.created_at else None
        }
