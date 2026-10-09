from datetime import date, timedelta
from app.extensions import db
from app.models import Goal, Habit, HabitLog, DailyCheckin, Activities, Wellbeing, LifeScore
from app.services.time_analysis_service import TimeAnalysisService
from sqlalchemy import func

class FutureGoalService:
    @staticmethod
    def _calculate_historical_metrics(user_id, days=30):
        user_id = int(user_id)
        cutoff = date.today() - timedelta(days=days - 1)
        
        metrics = {
            "data_sufficiency": False,
            "days_active": 0,
            "habit_consistency": 0,
            "goals_completed": 0,
            "productivity_score": 0,
            "focus_avg": 0,
            "strongest_category": None
        }

        # Days Active
        checkin_count = db.session.query(func.count(DailyCheckin.id)).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).scalar()
        
        metrics["days_active"] = checkin_count
        if checkin_count < 5:
            # Not enough data for a reliable prediction
            return metrics
            
        metrics["data_sufficiency"] = True

        # Habit Consistency
        total_habit_logs = db.session.query(func.count(HabitLog.id)).join(Habit).join(
            DailyCheckin, HabitLog.daily_checkin_id == DailyCheckin.id
        ).filter(
            Habit.user_id == user_id,
            DailyCheckin.date >= cutoff
        ).scalar()
        
        if total_habit_logs > 0:
            completed_logs = db.session.query(func.count(HabitLog.id)).join(Habit).join(
                DailyCheckin, HabitLog.daily_checkin_id == DailyCheckin.id
            ).filter(
                Habit.user_id == user_id,
                DailyCheckin.date >= cutoff,
                HabitLog.completed == True
            ).scalar()
            metrics["habit_consistency"] = round((completed_logs / total_habit_logs) * 100)
            
        # Goals Completed
        completed_goals_records = db.session.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.progress >= Goal.target,
            Goal.created_at >= cutoff
        ).all()
        metrics["goals_completed"] = len(completed_goals_records)
        metrics["recent_goals"] = [{"type": "goal", "id": g.id, "title": g.title, "date": g.created_at.isoformat() if g.created_at else None, "label": f"Goal — {g.category}"} for g in completed_goals_records[:5]]
        
        recent_habits = db.session.query(Habit).filter_by(user_id=user_id).order_by(Habit.created_at.desc()).limit(5).all()
        metrics["recent_habits"] = [{"type": "habit", "id": h.id, "title": h.name, "date": h.created_at.isoformat() if h.created_at else None, "label": f"Habit — {h.frequency}"} for h in recent_habits]
        
        # Determine strongest category based on goals
        categories = db.session.query(Goal.category, func.count(Goal.id)).filter(
            Goal.user_id == user_id,
            Goal.progress >= Goal.target
        ).group_by(Goal.category).order_by(func.count(Goal.id).desc()).first()
        
        if categories:
            metrics["strongest_category"] = categories[0]
            
        # Productivity and Focus
        time_analysis = TimeAnalysisService.analyze(user_id, days)
        if time_analysis and time_analysis["summary"]:
            metrics["productivity_score"] = time_analysis["summary"].get("averageProductivityScore", 0)
            metrics["focus_avg"] = time_analysis["summary"].get("averageFocus", 0)

        return metrics

    @staticmethod
    def _generate_rule_based_candidates(metrics):
        candidates = []
        
        if metrics["habit_consistency"] >= 80:
            candidates.append({
                "title": "Maintain High Habit Consistency",
                "category": "Consistency",
                "reason": "You have a strong foundation of daily habits. This goal is highly achievable.",
                "feasibility": "High"
            })
        elif metrics["habit_consistency"] > 0:
            candidates.append({
                "title": "Strengthen Daily Habit Execution",
                "category": "Consistency",
                "reason": f"Your current habit consistency is {metrics['habit_consistency']}%. Aiming for 80% will build solid routine momentum.",
                "feasibility": "High"
            })
        else:
            candidates.append({
                "title": "Establish 1 Core Daily Habit",
                "category": "Habits",
                "reason": "Starting with a single consistent routine creates compound positive growth.",
                "feasibility": "High"
            })
            
        if metrics["productivity_score"] >= 70:
            candidates.append({
                "title": "Increase Deep Work Allocation",
                "category": "Productivity",
                "reason": "Your productivity score is strong, suggesting you can comfortably sustain deeper work blocks.",
                "feasibility": "High"
            })
        elif metrics["productivity_score"] > 0 and metrics["productivity_score"] < 40:
            candidates.append({
                "title": "Reclaim 1 Hour of Productive Time",
                "category": "Productivity",
                "reason": "Your recent productivity score is lower. A modest goal to reclaim focused time is recommended.",
                "feasibility": "Medium"
            })
        else:
            candidates.append({
                "title": "Dedicated 45-Minute Focus Block",
                "category": "Productivity",
                "reason": "Building structured focus time boosts daily productivity scores.",
                "feasibility": "High"
            })
            
        if metrics["focus_avg"] >= 4.0:
            candidates.append({
                "title": "Tackle a Complex Learning Goal",
                "category": "Learning",
                "reason": "Your high average focus indicates you are primed for cognitively demanding tasks.",
                "feasibility": "High"
            })
        else:
            candidates.append({
                "title": "Daily Mindfulness or Reflection Routine",
                "category": "Wellbeing",
                "reason": "Consistent mindfulness and reflection help improve sustained daily focus.",
                "feasibility": "High"
            })
            
        if metrics["goals_completed"] >= 3:
            candidates.append({
                "title": "Set an Ambitious Stretch Goal",
                "category": "Personal Growth",
                "reason": "You have consistently hit your recent targets. It's time to stretch yourself.",
                "feasibility": "Medium"
            })
            
        return candidates

    @staticmethod
    def generate_predictions(user_id, days=30):
        metrics = FutureGoalService._calculate_historical_metrics(user_id, days)
        
        if not metrics["data_sufficiency"]:
            return {
                "data_sufficiency": False,
                "predictions": [],
                "metrics": metrics,
                "generated_at": date.today().isoformat(),
                "message": "Not enough history yet. Complete more check-ins, goals and habits to unlock personalized future goal predictions."
            }

        candidates = FutureGoalService._generate_rule_based_candidates(metrics)
        
        # We will pass metrics and candidates to LLM
        from app.services.llm_service import LLMService
        ai_predictions = LLMService.generate_future_goals(metrics, candidates)
        
        sources = []
        # If AI fails or returns empty, fallback to basic rule-based suggestions
        if not ai_predictions or "answer" not in ai_predictions:
            predictions = []
            for c in candidates[:3]:
                predictions.append({
                    "title": c["title"],
                    "category": c["category"],
                    "suggested_target": 1,
                    "confidence": 75 if c["feasibility"] == "High" else 60,
                    "feasibility": c["feasibility"],
                    "reason": c["reason"],
                    "evidence": [f"Based on historical metrics spanning {metrics['days_active']} days."]
                })
        else:
            predictions = ai_predictions.get("answer", [])
            sources = ai_predictions.get("sources", [])

        return {
            "data_sufficiency": True,
            "predictions": predictions,
            "sources": sources,
            "metrics": metrics, # Optional, for UI summary
            "generated_at": date.today().isoformat()
        }
