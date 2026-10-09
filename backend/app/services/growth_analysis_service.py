from app.services.ai_context_service import AIContextService

class GrowthAnalysisService:

    @staticmethod
    def _calculate_trend(history, value_key):
        if len(history) < 4:
            return "insufficient_data", 0

        mid = len(history) // 2
        early = history[:mid]
        late = history[mid:]

        early_avg = sum(item[value_key] for item in early) / len(early)
        late_avg = sum(item[value_key] for item in late) / len(late)

        change = late_avg - early_avg

        if change > 0.5:
            direction = "improving"
        elif change < -0.5:
            direction = "declining"
        else:
            direction = "stable"

        return direction, round(change, 2)

    # Removed duplicate pearson correlation logic

    @staticmethod
    def analyze(user_id, days=30):
        # 1. Obtain structured context
        ctx = AIContextService.build_user_context(user_id, days)

        summary = {
            "overall_score": None,
            "strongest_area": None,
            "weakest_area": None,
            "trend": "insufficient_data"
        }
        
        strengths = []
        weaknesses = []
        trends = []
        patterns = []
        correlations = []

        # 2. Extract metrics for overall score and strengths/weaknesses
        normalized_scores = {}
        
        # Life Score
        ls_avg = ctx.get("life_score", {}).get("average", 0)
        if ls_avg > 0:
            normalized_scores["Life Score"] = ls_avg
            if ls_avg >= 75:
                strengths.append({"area": "Life Score", "metric": "average", "value": ls_avg, "reason": "Consistently high Life Score."})
            elif ls_avg <= 50:
                weaknesses.append({"area": "Life Score", "metric": "average", "value": ls_avg, "reason": "Life Score is below optimal baseline."})

        # Mood
        mood_avg = ctx.get("mood", {}).get("average", 0)
        if mood_avg > 0:
            normalized_scores["Mood"] = mood_avg * 10
            if mood_avg >= 7.5:
                strengths.append({"area": "Mood", "metric": "average", "value": mood_avg, "reason": "Mood is consistently positive."})
            elif mood_avg <= 5.0:
                weaknesses.append({"area": "Mood", "metric": "average", "value": mood_avg, "reason": "Mood is trending low."})

        # Sleep
        sleep_avg = ctx.get("sleep", {}).get("average_hours", 0)
        if sleep_avg > 0:
            normalized_scores["Sleep"] = min(100, (sleep_avg / 8.0) * 100)
            if sleep_avg >= 7.0:
                strengths.append({"area": "Sleep", "metric": "average_hours", "value": sleep_avg, "reason": "Healthy sleep consistency."})
            elif sleep_avg <= 5.5:
                weaknesses.append({"area": "Sleep", "metric": "average_hours", "value": sleep_avg, "reason": "Insufficient average sleep."})

        # Habits
        habit_rate = ctx.get("habits", {}).get("completion_rate", 0)
        if habit_rate > 0:
            normalized_scores["Habits"] = habit_rate
            if habit_rate >= 80:
                strengths.append({"area": "Habits", "metric": "completion_rate", "value": habit_rate, "reason": "Strong habit completion rate."})
            elif habit_rate <= 40:
                weaknesses.append({"area": "Habits", "metric": "completion_rate", "value": habit_rate, "reason": "Low habit consistency."})

        # Calculate Overall Score & Strongest/Weakest
        if normalized_scores:
            summary["overall_score"] = round(sum(normalized_scores.values()) / len(normalized_scores))
            
            # Sort to find strongest and weakest
            sorted_scores = sorted(normalized_scores.items(), key=lambda x: x[1])
            summary["weakest_area"] = sorted_scores[0][0]
            summary["strongest_area"] = sorted_scores[-1][0]
            
            # Determine summary trend by combining all metrics
            # Easiest way: calculate overall change
            overall_improving = 0
            overall_declining = 0
            
            # 3. Trends
            if ctx["sleep"]["history"]:
                dir_sleep, change = GrowthAnalysisService._calculate_trend(ctx["sleep"]["history"], "hours")
                if dir_sleep != "insufficient_data":
                    trends.append({"metric": "Sleep", "direction": dir_sleep, "change": change, "confidence": "high"})
                    if dir_sleep == "improving": overall_improving += 1
                    elif dir_sleep == "declining": overall_declining += 1

            if ctx["mood"]["history"]:
                dir_mood, change = GrowthAnalysisService._calculate_trend(ctx["mood"]["history"], "score")
                if dir_mood != "insufficient_data":
                    trends.append({"metric": "Mood", "direction": dir_mood, "change": change, "confidence": "high"})
                    if dir_mood == "improving": overall_improving += 1
                    elif dir_mood == "declining": overall_declining += 1

            if ctx["life_score"]["history"]:
                dir_ls, change = GrowthAnalysisService._calculate_trend(ctx["life_score"]["history"], "score")
                if dir_ls != "insufficient_data":
                    trends.append({"metric": "Life Score", "direction": dir_ls, "change": change, "confidence": "high"})
                    if dir_ls == "improving": overall_improving += 1
                    elif dir_ls == "declining": overall_declining += 1

            if overall_improving > overall_declining:
                summary["trend"] = "improving"
            elif overall_declining > overall_improving:
                summary["trend"] = "declining"
            elif overall_improving == 0 and overall_declining == 0:
                if len(trends) > 0:
                    summary["trend"] = "stable"
            else:
                summary["trend"] = "stable"

        # 4. Correlations & Patterns
        from app.services.correlation_service import CorrelationService
        correlation_results = CorrelationService.get_correlations(user_id, days)
        
        for r in correlation_results:
            if r["status"] == "success" and abs(r["correlation"]) > 0.3:
                correlations.append({
                    "metric1": r["metric1"],
                    "metric2": r["metric2"],
                    "correlation": r["correlation"],
                    "strength": "strong" if abs(r["correlation"]) > 0.6 else "moderate",
                    "direction": "positive" if r["correlation"] > 0 else "negative"
                })
                patterns.append({
                    "type": "correlation",
                    "metric": f'{r["metric1"]}/{r["metric2"]}',
                    "description": r["insight"]
                })

        return {
            "period": ctx["period"],
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "trends": trends,
            "patterns": patterns,
            "correlations": correlations
        }
