from datetime import date, timedelta
from app.extensions import db
from app.models import User, DailyCheckin, Activities, Wellbeing, HabitLog, Goal
from sqlalchemy import func

class TimeAnalysisService:
    @staticmethod
    def _get_user_today(user_id):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if user and user.timezone and user.timezone != 'UTC':
            try:
                import zoneinfo
                from datetime import datetime
                tz = zoneinfo.ZoneInfo(user.timezone)
                return datetime.now(tz).date()
            except Exception:
                pass
        return date.today()

    @staticmethod
    def _calculate_score(productive_hrs, unproductive_hrs, focus, energy, habits_count, goals_count):
        # Base (max 40)
        base = min((productive_hrs / 4.0) * 40, 40) if productive_hrs > 0 else 0
        
        # Focus (max 20)
        focus_pts = (focus / 5.0) * 20 if focus else 0
        
        # Energy (max 10)
        energy_pts = (energy / 5.0) * 10 if energy else 0
        
        # Achievements (max 20)
        ach_pts = min((habits_count + goals_count) * 5, 20)
        
        # Penalty (max -20)
        penalty = max((unproductive_hrs - 2.0) * -5, -20) if unproductive_hrs > 2 else 0
        
        score = base + focus_pts + energy_pts + ach_pts + penalty
        return max(0, min(100, round(score)))

    @staticmethod
    def analyze(user_id, days=30):
        user_id = int(user_id)
        today = TimeAnalysisService._get_user_today(user_id)
        cutoff = today - timedelta(days=days - 1)
        
        # Fetch checkins with activities and wellbeing
        records = db.session.query(
            DailyCheckin.id,
            DailyCheckin.date,
            Activities.study_hours,
            Activities.work_hours,
            Activities.reading_minutes,
            Activities.meditation_minutes,
            Activities.exercise_minutes,
            Activities.leisure_hours,
            Activities.screen_time_minutes,
            Wellbeing.focus_level,
            Wellbeing.energy_level
        ).outerjoin(Activities, Activities.daily_checkin_id == DailyCheckin.id)\
         .outerjoin(Wellbeing, Wellbeing.daily_checkin_id == DailyCheckin.id)\
         .filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
         ).order_by(DailyCheckin.date.asc()).all()

        if not records:
            return {
                "summary": {
                    "averageProductivityScore": 0,
                    "productiveHoursTotal": 0,
                    "unproductiveHoursTotal": 0,
                    "averageFocus": 0
                },
                "daily": [],
                "patterns": [],
                "distributions": []
            }

        # Fetch Habits per day scoped to this user
        habit_logs = db.session.query(HabitLog.daily_checkin_id, func.count(HabitLog.id)).join(
            DailyCheckin, DailyCheckin.id == HabitLog.daily_checkin_id
        ).filter(
            DailyCheckin.user_id == user_id,
            HabitLog.completed == True
        ).group_by(HabitLog.daily_checkin_id).all()
        habit_map = {log[0]: log[1] for log in habit_logs}

        # Fetch Goals completed per day
        goal_logs = db.session.query(
            func.date(Goal.created_at), func.count(Goal.id)
        ).filter(
            Goal.user_id == user_id,
            Goal.progress >= Goal.target,
            Goal.created_at >= cutoff
        ).group_by(func.date(Goal.created_at)).all()
        # Ensure dates are date objects for mapping
        goal_map = {}
        for d_obj, count in goal_logs:
            if isinstance(d_obj, str):
                try:
                    d_obj = date.fromisoformat(d_obj[:10])
                except:
                    pass
            goal_map[d_obj] = count

        daily_data = []
        total_score = 0
        total_prod = 0
        total_unprod = 0
        total_focus = 0
        
        # Distribution accumulators
        dist_study = 0
        dist_work = 0
        dist_exercise = 0
        dist_reading = 0
        dist_meditation = 0
        
        focus_scores_by_weekday = {i: [] for i in range(7)}

        for r in records:
            checkin_id = r.id
            d = r.date
            
            # Extract hours safely
            study = r.study_hours or 0.0
            work = r.work_hours or 0.0
            read = (r.reading_minutes or 0) / 60.0
            med = (r.meditation_minutes or 0) / 60.0
            exc = (r.exercise_minutes or 0) / 60.0
            leisure = r.leisure_hours or 0.0
            screen = (r.screen_time_minutes or 0) / 60.0
            
            dist_study += study
            dist_work += work
            dist_reading += read
            dist_meditation += med
            dist_exercise += exc
            
            prod_hrs = study + work + read + med + exc
            unprod_hrs = leisure + screen
            
            focus = r.focus_level or 3
            energy = r.energy_level or 3
            
            total_prod += prod_hrs
            total_unprod += unprod_hrs
            total_focus += focus
            focus_scores_by_weekday[d.weekday()].append(focus)
            
            h_count = habit_map.get(checkin_id, 0)
            g_count = goal_map.get(d, 0)
            
            score = TimeAnalysisService._calculate_score(prod_hrs, unprod_hrs, focus, energy, h_count, g_count)
            total_score += score
            
            daily_data.append({
                "date": d.isoformat(),
                "score": score,
                "productiveHours": round(prod_hrs, 1),
                "unproductiveHours": round(unprod_hrs, 1),
                "focus": focus,
                "deepWork": round(study + work, 1)
            })

        num_days = len(daily_data)
        avg_score = round(total_score / num_days)
        avg_focus = round(total_focus / num_days, 1)
        
        patterns = []
        
        # Identify worst focus day
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        worst_day = None
        worst_avg = 5
        for wd, scores in focus_scores_by_weekday.items():
            if len(scores) >= 2: # need at least 2 occurrences
                avg = sum(scores) / len(scores)
                if avg < worst_avg:
                    worst_avg = avg
                    worst_day = day_names[wd]
                    
        if worst_day and worst_avg <= 3:
            patterns.append(f"Your lowest-focus days tend to occur on {worst_day}s.")
            
        # Identify low productivity periods
        low_days = [d for d in daily_data if d["score"] < 40]
        if len(low_days) > len(daily_data) * 0.3:
            patterns.append("You have had a consistent low-productivity period recently.")

        distributions = [
            {"name": "Study", "value": round(dist_study, 1)},
            {"name": "Deep Work", "value": round(dist_work, 1)},
            {"name": "Exercise", "value": round(dist_exercise, 1)},
            {"name": "Reading", "value": round(dist_reading, 1)},
            {"name": "Meditation", "value": round(dist_meditation, 1)}
        ]
        # Filter out 0s
        distributions = [d for d in distributions if d["value"] > 0]

        return {
            "summary": {
                "averageProductivityScore": avg_score,
                "productiveHoursTotal": round(total_prod, 1),
                "unproductiveHoursTotal": round(total_unprod, 1),
                "averageFocus": avg_focus,
                "lowProductivityDays": len(low_days)
            },
            "daily": daily_data,
            "patterns": patterns,
            "distributions": distributions
        }
