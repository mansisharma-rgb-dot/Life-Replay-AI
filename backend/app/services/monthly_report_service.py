import calendar
from datetime import date, datetime
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, HabitLog, Goal, Achievement, JournalEntry, DocumentMemory, LifeScore
from app.services.llm_service import LLMService

class MonthlyReportService:
    @staticmethod
    def _get_month_bounds(year, month):
        start_date = date(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        end_date = date(year, month, last_day)
        return start_date, end_date

    @staticmethod
    def get_monthly_report(user_id, year, month):
        user = db.session.get(User, user_id)
        if not user:
            return None, 404

        start_date, end_date = MonthlyReportService._get_month_bounds(year, month)
        mid_date = date(year, month, 15) # For first-half vs second-half trends
        
        # 1. Fetch Daily Checkins for the month
        checkins = db.session.query(DailyCheckin).options(
            joinedload(DailyCheckin.activities),
            joinedload(DailyCheckin.mood),
            joinedload(DailyCheckin.journal)
        ).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= start_date,
            DailyCheckin.date <= end_date,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()

        total_days_in_month = end_date.day
        total_checkins = len(checkins)

        # Basic Checks - if empty, return early or return zeroes
        if total_checkins == 0:
            return {
                "period": {"year": year, "month": month},
                "metrics": None,
                "trends": [],
                "highlights": [],
                "challenges": [],
                "memories": [],
                "narrative": None,
                "ai_available": False,
                "empty": True
            }, 200

        # Metrics Aggregation Variables
        total_life_score = 0
        ls_count = 0
        total_mood = 0
        mood_count = 0
        
        total_study_hours = 0.0
        total_work_hours = 0.0
        total_exercise_min = 0
        total_reading_min = 0
        total_meditation_min = 0
        total_sleep_hours = 0.0
        sleep_count = 0
        total_water = 0
        water_count = 0
        total_screen_time = 0
        screen_count = 0
        total_leisure = 0.0

        # Arrays for trends
        life_scores = LifeScore.query.filter(
            LifeScore.user_id == user_id,
            LifeScore.date >= start_date,
            LifeScore.date <= end_date
        ).order_by(LifeScore.date.asc()).all()

        ls_values = [ls.score for ls in life_scores]
        if ls_values:
            avg_life_score = sum(ls_values) / len(ls_values)
            best_ls = max(ls_values)
            worst_ls = min(ls_values)
        else:
            avg_life_score = 0
            best_ls = None
            worst_ls = None

        productivity_by_day = []
        mood_by_day = []
        first_half_mood = []
        second_half_mood = []
        first_half_prod = []
        second_half_prod = []

        most_productive_day = {"date": None, "hours": 0}

        for c in checkins:
            if c.mood:
                m = c.mood.mood_score
                total_mood += m
                mood_count += 1
                mood_by_day.append({"date": c.date.isoformat(), "value": m})
                
                if c.date <= mid_date:
                    first_half_mood.append(m)
                else:
                    second_half_mood.append(m)

            if c.activities:
                act = c.activities
                total_study_hours += act.study_hours
                total_work_hours += act.work_hours
                total_exercise_min += act.exercise_minutes
                total_reading_min += act.reading_minutes
                total_meditation_min += act.meditation_minutes
                
                if act.sleep_hours > 0:
                    total_sleep_hours += act.sleep_hours
                    sleep_count += 1
                if act.water_intake_ml > 0:
                    total_water += act.water_intake_ml
                    water_count += 1
                if act.screen_time_minutes > 0:
                    total_screen_time += act.screen_time_minutes
                    screen_count += 1
                
                total_leisure += act.leisure_hours
                
                deep_work = act.study_hours + act.work_hours
                productivity_by_day.append({"date": c.date.isoformat(), "value": deep_work})
                
                if deep_work > most_productive_day["hours"]:
                    most_productive_day = {"date": c.date.isoformat(), "hours": deep_work}
                    
                if c.date <= mid_date:
                    first_half_prod.append(deep_work)
                else:
                    second_half_prod.append(deep_work)

        # Habit metrics
        habit_logs = db.session.query(HabitLog).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= start_date,
            DailyCheckin.date <= end_date,
            DailyCheckin.is_completed == True
        ).all()
        
        habit_stats = {}
        total_habit_instances = 0
        total_habit_completed = 0
        for hl in habit_logs:
            if hl.name not in habit_stats:
                habit_stats[hl.name] = {"total": 0, "completed": 0}
            habit_stats[hl.name]["total"] += 1
            total_habit_instances += 1
            if hl.completed:
                habit_stats[hl.name]["completed"] += 1
                total_habit_completed += 1

        habit_completion_rate = round((total_habit_completed / total_habit_instances) * 100) if total_habit_instances > 0 else 0
        most_consistent_habit = None
        best_habit_rate = 0
        for name, stats in habit_stats.items():
            rate = stats["completed"] / stats["total"]
            if rate > best_habit_rate and stats["total"] >= 5: # Require at least 5 logs to be "most consistent"
                best_habit_rate = rate
                most_consistent_habit = name

        # Goals and Achievements
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        goals_completed = Goal.query.filter(
            Goal.user_id == user_id,
            Goal.created_at >= start_datetime,
            Goal.created_at <= end_datetime,
            Goal.progress >= Goal.target
        ).all()

        achievements_unlocked = Achievement.query.filter(
            Achievement.user_id == user_id,
            Achievement.unlocked_at >= start_datetime,
            Achievement.unlocked_at <= end_datetime
        ).all()

        # Memories and Journals
        journals = [c.journal for c in checkins if c.journal and (c.journal.title or c.journal.content)]
        
        docs = DocumentMemory.query.filter(
            DocumentMemory.user_id == user_id,
            DocumentMemory.created_at >= start_datetime,
            DocumentMemory.created_at <= end_datetime
        ).all()

        memories = []
        for j in journals:
            j_date = j.checkin.date.isoformat() if (j.checkin and j.checkin.date) else date.today().isoformat()
            memories.append({
                "type": "journal",
                "id": j.id,
                "title": j.title or "Journal Entry",
                "content": j.content[:150] + "..." if j.content and len(j.content) > 150 else j.content,
                "date": j_date
            })
        for d in docs:
            memories.append({
                "type": "document",
                "id": d.id,
                "title": d.title or d.original_name,
                "content": d.summary or "A document you processed this month.",
                "date": d.created_at.isoformat()
            })
            
        memories.sort(key=lambda x: x["date"], reverse=True)

        # Trends Calculation
        trends = []
        
        if len(first_half_mood) > 3 and len(second_half_mood) > 3:
            fh_m = sum(first_half_mood) / len(first_half_mood)
            sh_m = sum(second_half_mood) / len(second_half_mood)
            if sh_m - fh_m > 0.5:
                trends.append({"type": "positive", "text": "Your mood was noticeably higher during the second half of the month."})
            elif fh_m - sh_m > 0.5:
                trends.append({"type": "negative", "text": "Your mood dipped during the second half of the month."})

        if len(first_half_prod) > 3 and len(second_half_prod) > 3:
            fh_p = sum(first_half_prod) / len(first_half_prod)
            sh_p = sum(second_half_prod) / len(second_half_prod)
            if sh_p - fh_p > 1.0:
                trends.append({"type": "positive", "text": "Your focus and productivity improved significantly towards the end of the month."})
            elif fh_p - sh_p > 1.0:
                trends.append({"type": "negative", "text": "Your productivity decreased in the second half of the month."})

        # Highlights Calculation
        highlights = []
        if best_ls:
            highlights.append({"title": "Highest Life Score", "description": f"Reached a peak Life Score of {best_ls}."})
        if most_productive_day["hours"] > 0:
            highlights.append({"title": "Most Productive Day", "description": f"Logged {round(most_productive_day['hours'], 1)} hours of deep work on {most_productive_day['date']}."})
        if most_consistent_habit:
            highlights.append({"title": "Habit Champion", "description": f"Extremely consistent with '{most_consistent_habit}' this month."})
        for g in goals_completed[:2]:
            highlights.append({"title": "Goal Completed", "description": f"Achieved your target for: {g.title}"})
        for a in achievements_unlocked[:2]:
            highlights.append({"title": "Achievement Unlocked", "description": f"Earned '{a.name}' this month."})

        # Challenges Calculation
        challenges = []
        if habit_completion_rate > 0 and habit_completion_rate < 50:
            challenges.append("Habit consistency was lower than usual.")
        if sleep_count > 0 and (total_sleep_hours / sleep_count) < 6:
            challenges.append("Average sleep dropped below 6 hours, which may have impacted energy.")
        if screen_count > 0 and (total_screen_time / screen_count) > 240:
            challenges.append("Screen time was high this month, averaging over 4 hours per tracked day.")
        checkin_consistency = round((total_checkins / total_days_in_month) * 100)
        if checkin_consistency < 40:
            challenges.append("Check-in consistency was low, making it harder to track full trends.")

        # Prepare Metrics Dictionary
        metrics = {
            "total_checkin_days": total_checkins,
            "average_life_score": round(avg_life_score) if avg_life_score else None,
            "average_mood": round(total_mood / mood_count, 1) if mood_count else None,
            "average_energy": None,
            "average_stress": None,
            "total_study_hours": round(total_study_hours, 1),
            "total_work_hours": round(total_work_hours, 1),
            "total_meditation_minutes": total_meditation_min,
            "total_exercise_minutes": total_exercise_min,
            "total_reading_minutes": total_reading_min,
            "average_sleep_hours": round(total_sleep_hours / sleep_count, 1) if sleep_count else None,
            "average_water_intake_ml": round(total_water / water_count) if water_count else None,
            "average_screen_time_minutes": round(total_screen_time / screen_count) if screen_count else None,
            "total_leisure_hours": round(total_leisure, 1),
            "habit_completion_rate": habit_completion_rate,
            "completed_goals": len(goals_completed),
            "achievements_unlocked": len(achievements_unlocked),
            "journal_entries_count": len(journals),
            "processed_documents_count": len(docs),
            "mood_history": mood_by_day,
            "productivity_history": productivity_by_day
        }

        # Build Context for LLM
        context = {
            "period": f"{calendar.month_name[month]} {year}",
            "metrics": metrics,
            "trends": trends,
            "highlights": highlights,
            "challenges": challenges
        }

        user = User.query.get(user_id)
        user_preferences = {
            'ai_style': user.ai_style if user else 'Balanced',
            'ai_coaching': user.ai_coaching if user else 'Neutral',
            'ai_focus_areas': user.ai_focus_areas if user else None
        }
        
        # 7. Generate Narrative using LLM
        narrative = LLMService.generate_monthly_report(context, user_preferences=user_preferences)
        ai_available = bool(narrative and not narrative.get("is_fallback"))

        return {
            "period": {"year": year, "month": month, "month_name": calendar.month_name[month]},
            "metrics": metrics,
            "trends": trends,
            "highlights": highlights,
            "challenges": challenges,
            "memories": memories,
            "narrative": narrative,
            "ai_available": ai_available,
            "empty": False
        }, 200

    @staticmethod
    def get_weekly_report(user_id, start_date=None, end_date=None):
        user = db.session.get(User, user_id)
        if not user:
            return None, 404

        today = date.today()
        if not end_date:
            end_date = today
        if not start_date:
            start_date = end_date - timedelta(days=6)

        checkins = db.session.query(DailyCheckin).options(
            joinedload(DailyCheckin.activities),
            joinedload(DailyCheckin.mood),
            joinedload(DailyCheckin.journal)
        ).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= start_date,
            DailyCheckin.date <= end_date,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()

        total_checkins = len(checkins)
        if total_checkins == 0:
            return {
                "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "label": f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d, %Y')}"},
                "metrics": None,
                "trends": [],
                "highlights": [],
                "challenges": [],
                "memories": [],
                "narrative": None,
                "ai_available": False,
                "empty": True
            }, 200

        total_study_hours = 0.0
        total_work_hours = 0.0
        total_sleep_hours = 0.0
        sleep_count = 0
        total_water = 0
        water_count = 0
        total_mood = 0
        mood_count = 0
        productivity_by_day = []
        mood_by_day = []

        for c in checkins:
            d_str = c.date.isoformat()
            if c.activities:
                study = c.activities.study_hours or 0.0
                work = c.activities.work_hours or 0.0
                total_study_hours += study
                total_work_hours += work
                productivity_by_day.append({"date": d_str, "value": round(study + work, 1)})
                if c.activities.sleep_hours:
                    total_sleep_hours += c.activities.sleep_hours
                    sleep_count += 1
                if c.activities.water_intake_ml:
                    total_water += c.activities.water_intake_ml
                    water_count += 1
            if c.mood:
                total_mood += c.mood.mood_score
                mood_count += 1
                mood_by_day.append({"date": d_str, "value": c.mood.mood_score})

        # Life Scores
        life_scores = LifeScore.query.filter(
            LifeScore.user_id == user_id,
            LifeScore.date >= start_date,
            LifeScore.date <= end_date
        ).order_by(LifeScore.date.asc()).all()
        avg_life_score = round(sum([ls.score for ls in life_scores]) / len(life_scores)) if life_scores else None

        # Habit consistency
        habit_logs = db.session.query(HabitLog).join(DailyCheckin).filter(
            HabitLog.user_id == user_id,
            DailyCheckin.date >= start_date,
            DailyCheckin.date <= end_date,
            DailyCheckin.is_completed == True
        ).all()
        habit_completion_rate = round((sum(1 for h in habit_logs if h.completed) / len(habit_logs)) * 100) if habit_logs else 0

        # Goals & Achievements
        goals_completed = Goal.query.filter(
            Goal.user_id == user_id,
            Goal.status == 'completed',
            Goal.created_at >= start_date
        ).all()
        
        achievements_unlocked = Achievement.query.filter(
            Achievement.user_id == user_id,
            Achievement.unlocked_at >= start_date
        ).all()

        metrics = {
            "total_checkin_days": total_checkins,
            "average_life_score": avg_life_score,
            "average_mood": round(total_mood / mood_count, 1) if mood_count else None,
            "total_study_hours": round(total_study_hours, 1),
            "total_work_hours": round(total_work_hours, 1),
            "average_sleep_hours": round(total_sleep_hours / sleep_count, 1) if sleep_count else None,
            "average_water_intake_ml": round(total_water / water_count) if water_count else None,
            "habit_completion_rate": habit_completion_rate,
            "completed_goals": len(goals_completed),
            "achievements_unlocked": len(achievements_unlocked),
            "mood_history": mood_by_day,
            "productivity_history": productivity_by_day
        }

        highlights = []
        if total_checkins >= 5:
            highlights.append({"title": "Consistent Tracking", "description": f"Completed {total_checkins} check-ins this week."})
        if total_study_hours + total_work_hours > 10:
            highlights.append({"title": "High Deep Work", "description": f"Logged {round(total_study_hours + total_work_hours, 1)} hours of focused deep work."})
        for g in goals_completed[:2]:
            highlights.append({"title": "Goal Completed", "description": f"Achieved target for: {g.title}"})

        challenges = []
        if habit_completion_rate < 50 and habit_logs:
            challenges.append("Habit completion dipped below 50% this week.")
        if sleep_count > 0 and (total_sleep_hours / sleep_count) < 6:
            challenges.append("Average sleep dropped below 6 hours.")

        context = {
            "period": f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d, %Y')}",
            "metrics": metrics,
            "trends": [],
            "highlights": highlights,
            "challenges": challenges
        }

        user_preferences = {
            'ai_style': user.ai_style if user else 'Balanced',
            'ai_coaching': user.ai_coaching if user else 'Neutral',
            'ai_focus_areas': user.ai_focus_areas if user else None
        }

        narrative = LLMService.generate_monthly_report(context, user_preferences=user_preferences)
        ai_available = bool(narrative and not narrative.get("is_fallback"))

        return {
            "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "label": f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d, %Y')}"},
            "metrics": metrics,
            "trends": [],
            "highlights": highlights,
            "challenges": challenges,
            "memories": [],
            "narrative": narrative,
            "ai_available": ai_available,
            "empty": False
        }, 200

