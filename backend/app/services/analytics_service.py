from datetime import date, timedelta
from sqlalchemy import func
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, HabitLog, Goal, Achievement, LifeScore

class AnalyticsService:
    @staticmethod
    def _get_date_cutoff(days, user_id=None):
        today = date.today()
        if user_id is not None:
            user = db.session.get(User, int(user_id))
            if user and user.timezone and user.timezone != 'UTC':
                try:
                    import zoneinfo
                    from datetime import datetime
                    tz = zoneinfo.ZoneInfo(user.timezone)
                    today = datetime.now(tz).date()
                except Exception:
                    pass
        return today - timedelta(days=days - 1)

    @staticmethod
    def get_overview(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        user = db.session.get(User, user_id)
        if not user:
            return None, 404

        # Aggregates from daily checkins
        checkin_stats = db.session.query(
            func.count(DailyCheckin.id),
            func.avg(DailyCheckin.daily_rating)
        ).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).first()
        
        total_checkins = checkin_stats[0] if (checkin_stats and checkin_stats[0] is not None) else 0
        completion_rate = int((total_checkins / days) * 100) if days > 0 else 0
        
        # Aggregates from activities
        act_stats = db.session.query(
            func.sum(Activities.study_hours),
            func.sum(Activities.work_hours),
            func.sum(Activities.exercise_minutes),
            func.avg(Activities.sleep_hours),
            func.avg(Activities.water_intake_ml)
        ).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).first()

        total_study = ((act_stats[0] or 0.0) + (act_stats[1] or 0.0)) if act_stats else 0.0
        total_exercise = ((act_stats[2] or 0) / 60.0) if act_stats else 0.0
        avg_sleep = (act_stats[3] or 0.0) if act_stats else 0.0
        avg_water = (act_stats[4] or 0.0) if act_stats else 0.0
        
        # Average Life Score
        ls_avg = db.session.query(func.avg(LifeScore.score)).filter(
            LifeScore.user_id == user_id,
            LifeScore.date >= cutoff
        ).scalar() or 0.0

        # Average Mood
        mood_avg = db.session.query(func.avg(MoodLog.mood_score)).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).scalar() or 0.0
        
        return {
            "averageLifeScore": round(ls_avg) if ls_avg is not None else 0,
            "currentStreak": user.current_streak or 0,
            "longestStreak": user.longest_streak or 0,
            "totalXp": user.total_xp or 0,
            "currentLevel": user.level or 1,
            "totalCheckins": total_checkins,
            "completionRate": completion_rate,
            "averageMood": round(mood_avg, 1) if mood_avg is not None else 0.0,
            "totalStudyHours": round(total_study, 1),
            "totalExerciseHours": round(total_exercise, 1),
            "averageSleep": round(avg_sleep, 1),
            "averageWaterIntake": round(avg_water / 1000.0, 1),
            "trends": {
                "lifeScore": {"value": 0, "direction": "neutral", "label": "vs last week"},
                "streak": {"value": 0, "direction": "neutral", "label": "vs last week"},
                "xp": {"value": 0, "direction": "neutral", "label": "vs last week"},
                "mood": {"value": 0, "direction": "neutral", "label": "vs last week"},
                "productivity": {"value": 0, "direction": "neutral", "label": "vs last week"}
            }
        }, 200

    @staticmethod
    def get_life_score_analytics(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        scores = LifeScore.query.filter(
            LifeScore.user_id == user_id,
            LifeScore.date >= cutoff
        ).order_by(LifeScore.date.asc()).all()
        
        if not scores:
            return {"average": 0, "highest": 0, "lowest": 0, "history": []}, 200
            
        history = []
        total = 0
        mx = 0
        mn = 100
        window = []
        
        for s in scores:
            total += s.score
            if s.score > mx: mx = s.score
            if s.score < mn: mn = s.score
            
            window.append(s.score)
            if len(window) > 3:
                window.pop(0)
            
            ma = sum(window) / len(window)
            # Match example precision (integer if possible, float otherwise)
            ma = int(ma) if ma.is_integer() else round(ma, 1)
            
            history.append({
                "date": s.date.isoformat(),
                "score": s.score,
                "movingAverage": ma
            })
            
        return {
            "average": round(total / len(scores)),
            "highest": mx,
            "lowest": mn,
            "history": history
        }, 200

    @staticmethod
    def get_mood_analytics(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        logs = db.session.query(MoodLog, DailyCheckin.date).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()
        
        if not logs:
            return {
                "averageMood": 0, "bestMoodDay": "-", "worstMoodDay": "-",
                "distribution": [
                    {"name": 'Amazing (9-10)', "value": 0},
                    {"name": 'Good (7-8)', "value": 0},
                    {"name": 'Okay (5-6)', "value": 0},
                    {"name": 'Bad (3-4)', "value": 0},
                    {"name": 'Terrible (1-2)', "value": 0}
                ], "history": []
            }, 200
            
        total_mood = 0
        history = []
        dist = [0, 0, 0, 0, 0]
        day_avg = {i: [] for i in range(7)}
        
        for mood, d in logs:
            score = mood.mood_score
            total_mood += score
            history.append({"date": d.isoformat(), "mood": score})
            day_avg[d.weekday()].append(score)
            
            if score >= 9: dist[0] += 1
            elif score >= 7: dist[1] += 1
            elif score >= 5: dist[2] += 1
            elif score >= 3: dist[3] += 1
            else: dist[4] += 1
            
        avg_mood = total_mood / len(logs)
        
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        best_day, worst_day = "-", "-"
        best_val, worst_val = -1, 11
        for i, scores in day_avg.items():
            if not scores: continue
            avg = sum(scores) / len(scores)
            if avg > best_val:
                best_val = avg
                best_day = day_names[i]
            if avg < worst_val:
                worst_val = avg
                worst_day = day_names[i]
                
        total_dist = sum(dist)
        distribution = [
            {"name": 'Amazing (9-10)', "value": round(dist[0]/total_dist*100) if total_dist else 0},
            {"name": 'Good (7-8)', "value": round(dist[1]/total_dist*100) if total_dist else 0},
            {"name": 'Okay (5-6)', "value": round(dist[2]/total_dist*100) if total_dist else 0},
            {"name": 'Bad (3-4)', "value": round(dist[3]/total_dist*100) if total_dist else 0},
            {"name": 'Terrible (1-2)', "value": round(dist[4]/total_dist*100) if total_dist else 0},
        ]
        
        return {
            "averageMood": round(avg_mood, 1),
            "bestMoodDay": best_day,
            "worstMoodDay": worst_day,
            "distribution": distribution,
            "history": history
        }, 200

    @staticmethod
    def get_habit_analytics(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        logs = db.session.query(HabitLog).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).all()
        
        if not logs:
            return {
                "completionRate": 0, "consistencyScore": 0, "currentStreak": 0, "longestStreak": 0,
                "mostCompleted": {"name": "-", "count": 0},
                "leastCompleted": {"name": "-", "count": 0},
                "habits": []
            }, 200
            
        habit_stats = {}
        for log in logs:
            if log.name not in habit_stats:
                habit_stats[log.name] = {"total": 0, "completed": 0}
            habit_stats[log.name]["total"] += 1
            if log.completed:
                habit_stats[log.name]["completed"] += 1
                
        habits_res = []
        overall_completed = 0
        overall_total = 0
        
        for name, stat in habit_stats.items():
            overall_total += stat["total"]
            overall_completed += stat["completed"]
            rate = round((stat["completed"] / stat["total"]) * 100)
            habits_res.append({"name": name, "completion": rate, "_count": stat["completed"]})
            
        habits_res.sort(key=lambda x: x["completion"], reverse=True)
        
        most_completed = {"name": "-", "count": 0}
        least_completed = {"name": "-", "count": 0}
        if habits_res:
            sorted_by_count = sorted(habits_res, key=lambda x: x["_count"])
            most_completed = {"name": sorted_by_count[-1]["name"], "count": sorted_by_count[-1]["_count"]}
            least_completed = {"name": sorted_by_count[0]["name"], "count": sorted_by_count[0]["_count"]}
            
        for h in habits_res:
            del h["_count"]
            
        return {
            "completionRate": round((overall_completed / overall_total) * 100) if overall_total else 0,
            "consistencyScore": round((overall_completed / overall_total) * 100) if overall_total else 0,
            "currentStreak": 0,
            "longestStreak": 0,
            "mostCompleted": most_completed,
            "leastCompleted": least_completed,
            "habits": habits_res
        }, 200

    @staticmethod
    def get_productivity_analytics(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        records = db.session.query(Activities, DailyCheckin.date, DailyCheckin.id).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()
        
        if not records:
            return {
                "studyHours": 0, "workHours": 0, "readingHours": 0, "meditationHours": 0,
                "exerciseHours": 0, "screenTime": 0, "deepWork": 0,
                "distribution": [], "history": []
            }, 200
            
        study_hours = sum([r[0].study_hours or 0 for r in records])
        work_hours = sum([r[0].work_hours or 0 for r in records])
        reading_hours = sum([r[0].reading_minutes or 0 for r in records]) / 60.0
        meditation_hours = sum([r[0].meditation_minutes or 0 for r in records]) / 60.0
        exercise_hours = sum([r[0].exercise_minutes or 0 for r in records]) / 60.0
        screen_time = sum([r[0].screen_time_minutes or 0 for r in records]) / 60.0
        
        deep_work = study_hours + work_hours
        
        distribution = [
            {"name": "Study", "value": round(study_hours, 1)},
            {"name": "Work", "value": round(work_hours, 1)},
            {"name": "Exercise", "value": round(exercise_hours, 1)},
            {"name": "Reading", "value": round(reading_hours, 1)},
            {"name": "Other", "value": round(meditation_hours, 1)}
        ]
        
        # Query completed habit logs per checkin
        checkin_ids = [r[2] for r in records if r[2]]
        habit_counts = {}
        if checkin_ids:
            h_logs = db.session.query(HabitLog.daily_checkin_id, func.count(HabitLog.id)).filter(
                HabitLog.user_id == user_id,
                HabitLog.daily_checkin_id.in_(checkin_ids),
                HabitLog.completed == True
            ).group_by(HabitLog.daily_checkin_id).all()
            habit_counts = {hl[0]: hl[1] for hl in h_logs}
        
        history = []
        for act, d, c_id in records:
            focus_time = (act.study_hours or 0.0) + (act.work_hours or 0.0)
            completed_tasks = habit_counts.get(c_id, 0)
            # If no habit logs recorded but focus time exists, provide a sensible default count
            if completed_tasks == 0 and focus_time > 0:
                completed_tasks = 1
                
            history.append({
                "date": d.isoformat(),
                "day": d.strftime("%a"),
                "focus": round(focus_time, 1),
                "tasks": completed_tasks,
                "screenTime": round((act.screen_time_minutes or 0) / 60.0, 1)
            })
            
        return {
            "studyHours": round(study_hours, 1),
            "workHours": round(work_hours, 1),
            "readingHours": round(reading_hours, 1),
            "meditationHours": round(meditation_hours, 1),
            "exerciseHours": round(exercise_hours, 1),
            "screenTime": round(screen_time, 1),
            "deepWork": round(deep_work, 1),
            "distribution": distribution,
            "history": history
        }, 200

    @staticmethod
    def get_sleep_analytics(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        records = db.session.query(Activities.sleep_hours, DailyCheckin.date).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()
        
        if not records:
            return {"averageSleep": 0, "bestSleepDay": "-", "worstSleepDay": "-", "history": []}, 200
            
        history = []
        day_avg = {i: [] for i in range(7)}
        total = 0
        
        for sleep, d in records:
            total += sleep
            history.append({"date": d.isoformat(), "hours": sleep, "quality": None})
            day_avg[d.weekday()].append(sleep)
            
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        best_day, worst_day = "-", "-"
        best_val, worst_val = -1, 25
        for i, scores in day_avg.items():
            if not scores: continue
            avg = sum(scores) / len(scores)
            if avg > best_val:
                best_val = avg
                best_day = day_names[i]
            if avg < worst_val:
                worst_val = avg
                worst_day = day_names[i]
                
        return {
            "averageSleep": round(total / len(records), 1) if records else 0,
            "bestSleepDay": best_day,
            "worstSleepDay": worst_day,
            "history": history
        }, 200

    @staticmethod
    def get_water_analytics(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        records = db.session.query(Activities.water_intake_ml, DailyCheckin.date).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()
        
        if not records:
            return {"averageIntake": 0, "goalCompletion": 0, "history": []}, 200
            
        history = []
        total_ml = 0
        days_met_goal = 0
        goal_ml = 2000
        
        for water, d in records:
            total_ml += water
            history.append({"date": d.isoformat(), "liters": round(water / 1000.0, 1)})
            if water >= goal_ml: days_met_goal += 1
            
        return {
            "averageIntake": round((total_ml / len(records)) / 1000.0, 1) if records else 0,
            "goalCompletion": round((days_met_goal / len(records)) * 100) if records else 0,
            "history": history
        }, 200

    @staticmethod
    def get_goal_progress(user_id):
        user_id = int(user_id)
        goals = Goal.query.filter_by(user_id=user_id).all()
        if not goals:
            return {"completedGoals": 0, "pendingGoals": 0, "completionRate": 0, "goals": []}, 200
            
        completed = 0
        pending = 0
        out = []
        for g in goals:
            is_completed = g.progress >= g.target
            if is_completed: completed += 1
            else: pending += 1
            
            out.append({
                "id": g.id,
                "title": g.title,
                "progress": g.progress,
                "target": g.target,
                "category": g.category
            })
            
        return {
            "completedGoals": completed,
            "pendingGoals": pending,
            "completionRate": round((completed / len(goals)) * 100) if goals else 0,
            "goals": out
        }, 200

    @staticmethod
    def get_achievements(user_id):
        user_id = int(user_id)
        achs = Achievement.query.filter_by(user_id=user_id).order_by(Achievement.unlocked_at.desc()).all()
        
        recent = []
        for a in achs[:3]:
            recent.append({
                "id": a.id,
                "name": a.name,
                "date": a.unlocked_at.isoformat() if a.unlocked_at else None,
                "icon": a.icon
            })
            
        return {
            "unlockedCount": len(achs),
            "totalAvailable": 50,
            "newestBadge": {"name": achs[0].name, "description": achs[0].description, "icon": achs[0].icon} if achs else None,
            "rarestBadge": None,
            "recent": recent
        }, 200

    @staticmethod
    def get_correlations(user_id, days):
        user_id = int(user_id)
        cutoff = AnalyticsService._get_date_cutoff(days, user_id)
        records = db.session.query(DailyCheckin.date, Activities.sleep_hours, MoodLog.mood_score).join(
            Activities, Activities.daily_checkin_id == DailyCheckin.id
        ).join(
            MoodLog, MoodLog.daily_checkin_id == DailyCheckin.id
        ).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
        ).all()
        
        if len(records) < 3:
            return [], 200
            
        n = len(records)
        sum_x = sum([r.sleep_hours for r in records])
        sum_y = sum([r.mood_score for r in records])
        sum_xy = sum([r.sleep_hours * r.mood_score for r in records])
        sum_x2 = sum([r.sleep_hours**2 for r in records])
        sum_y2 = sum([r.mood_score**2 for r in records])
        
        numerator = (n * sum_xy) - (sum_x * sum_y)
        denom_x = (n * sum_x2) - (sum_x**2)
        denom_y = (n * sum_y2) - (sum_y**2)
        
        if denom_x <= 0 or denom_y <= 0:
            r = 0.0
        else:
            r = numerator / ((denom_x * denom_y) ** 0.5)
            
        if r > 0.6:
            insight = "Strong positive correlation: better sleep strongly aligns with better mood."
        elif r > 0.3:
            insight = "Moderate positive correlation: sleep generally improves mood."
        elif r < -0.6:
            insight = "Strong negative correlation: more sleep aligns with worse mood."
        else:
            insight = "No significant correlation detected."
            
        return [
            {"id": 1, "metric1": "Sleep", "metric2": "Mood", "correlation": round(r, 2), "insight": insight}
        ], 200
