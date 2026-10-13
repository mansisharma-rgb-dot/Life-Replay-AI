import math
from datetime import date, timedelta
from app.extensions import db
from app.models import DailyCheckin, Activities, MoodLog, Wellbeing, LifeScore, HabitLog

class CorrelationService:
    MIN_SAMPLE_SIZE = 5

    @staticmethod
    def _calculate_pearson(data):
        n = len(data)
        if n < CorrelationService.MIN_SAMPLE_SIZE:
            return None
        
        sum_x = sum([d[0] for d in data])
        sum_y = sum([d[1] for d in data])
        sum_xy = sum([d[0] * d[1] for d in data])
        sum_x2 = sum([d[0]**2 for d in data])
        sum_y2 = sum([d[1]**2 for d in data])
        
        numerator = (n * sum_xy) - (sum_x * sum_y)
        denom_x = (n * sum_x2) - (sum_x**2)
        denom_y = (n * sum_y2) - (sum_y**2)
        
        if denom_x <= 0 or denom_y <= 0:
            return 0.0
            
        r = numerator / math.sqrt(denom_x * denom_y)
        return r

    @staticmethod
    def _interpret(r, metric_a, metric_b):
        if r is None:
            return "Insufficient data to determine a relationship."
            
        strength = ""
        if abs(r) > 0.6:
            strength = "Strong"
        elif abs(r) > 0.3:
            strength = "Moderate"
        else:
            return f"Weak or no measurable association between {metric_a} and {metric_b}."
            
        direction = "positive" if r > 0 else "negative"
        
        if direction == "positive":
            return f"{strength} positive association: Higher {metric_a} tends to coincide with higher {metric_b}."
        else:
            return f"{strength} negative association: Higher {metric_a} appears related to lower {metric_b}."

    @staticmethod
    def get_correlations(user_id, days):
        user_id = int(user_id)
        cutoff = date.today() - timedelta(days=days - 1)
        
        # We need a unified query that joins all the necessary daily data
        # Using outer joins from DailyCheckin
        records = db.session.query(
            DailyCheckin.id,
            DailyCheckin.date,
            Activities.sleep_hours,
            Activities.study_hours,
            Activities.work_hours,
            Activities.meditation_minutes,
            Activities.water_intake_ml,
            MoodLog.mood_score,
            Wellbeing.stress_level,
            Wellbeing.energy_level,
            LifeScore.score.label('life_score')
        ).outerjoin(Activities, Activities.daily_checkin_id == DailyCheckin.id)\
         .outerjoin(MoodLog, MoodLog.daily_checkin_id == DailyCheckin.id)\
         .outerjoin(Wellbeing, Wellbeing.daily_checkin_id == DailyCheckin.id)\
         .outerjoin(LifeScore, (LifeScore.user_id == DailyCheckin.user_id) & (LifeScore.date == DailyCheckin.date))\
         .filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= cutoff,
            DailyCheckin.is_completed == True
         ).all()

        # We also need habit completions per day
        habit_logs = db.session.query(HabitLog.daily_checkin_id, db.func.count(HabitLog.id)).filter(
            HabitLog.user_id == user_id,
            HabitLog.completed == True
        ).group_by(HabitLog.daily_checkin_id).all()
        
        habit_map = {log[0]: log[1] for log in habit_logs}

        pairs = [
            {"id": "sleep_mood", "name": "Sleep ↔ Mood", "a": "Sleep", "b": "Mood", "data": []},
            {"id": "sleep_lifescore", "name": "Sleep ↔ Life Score", "a": "Sleep", "b": "Life Score", "data": []},
            {"id": "sleep_prod", "name": "Sleep ↔ Productivity", "a": "Sleep", "b": "Productivity", "data": []},
            {"id": "study_lifescore", "name": "Study ↔ Life Score", "a": "Study", "b": "Life Score", "data": []},
            {"id": "meditation_stress", "name": "Meditation ↔ Stress", "a": "Meditation", "b": "Stress", "data": []},
            {"id": "water_energy", "name": "Water ↔ Energy", "a": "Water", "b": "Energy", "data": []},
            {"id": "mood_prod", "name": "Mood ↔ Productivity", "a": "Mood", "b": "Productivity", "data": []},
            {"id": "habit_lifescore", "name": "Habits ↔ Life Score", "a": "Habits", "b": "Life Score", "data": []},
        ]

        # Extract data pairs safely
        for r in records:
            checkin_id = r.id
            sleep = r.sleep_hours
            study = r.study_hours
            prod = (r.study_hours or 0) + (r.work_hours or 0)
            med = r.meditation_minutes
            water = r.water_intake_ml
            mood = r.mood_score
            stress = r.stress_level
            energy = r.energy_level
            ls = r.life_score
            habits = habit_map.get(checkin_id, 0)

            # Sleep ↔ Mood
            if sleep is not None and mood is not None and sleep > 0:
                pairs[0]["data"].append((sleep, mood))
            # Sleep ↔ Life Score
            if sleep is not None and ls is not None and sleep > 0:
                pairs[1]["data"].append((sleep, ls))
            # Sleep ↔ Productivity
            if sleep is not None and prod is not None and sleep > 0 and prod > 0:
                pairs[2]["data"].append((sleep, prod))
            # Study ↔ Life Score
            if study is not None and ls is not None and study > 0:
                pairs[3]["data"].append((study, ls))
            # Meditation ↔ Stress
            if med is not None and stress is not None and med >= 0:
                pairs[4]["data"].append((med, stress))
            # Water ↔ Energy
            if water is not None and energy is not None and water > 0:
                pairs[5]["data"].append((water, energy))
            # Mood ↔ Productivity
            if mood is not None and prod is not None and prod > 0:
                pairs[6]["data"].append((mood, prod))
            # Habits ↔ Life Score
            if ls is not None:
                pairs[7]["data"].append((habits, ls))

        results = []
        for p in pairs:
            r = CorrelationService._calculate_pearson(p["data"])
            insight = CorrelationService._interpret(r, p["a"], p["b"])
            results.append({
                "id": p["id"],
                "metric1": p["a"],
                "metric2": p["b"],
                "name": p["name"],
                "correlation": round(r, 2) if r is not None else None,
                "sampleSize": len(p["data"]),
                "insight": insight,
                "status": "insufficient_data" if r is None else "success"
            })

        return results
