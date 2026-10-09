from app.services.ai_context_service import AIContextService
from app.services.growth_analysis_service import GrowthAnalysisService

class RecommendationService:
    @staticmethod
    def generate(user_id, days=30, context=None, analysis=None):
        # 1. Obtain Context & Analysis (accept pre-built to avoid redundant DB calls)
        if context is None:
            context = AIContextService.build_user_context(user_id, days)
        if analysis is None:
            analysis = GrowthAnalysisService.analyze(user_id, days)

        recommendations = []
        
        # 2. Check for insufficient data
        if analysis.get("summary", {}).get("trend") == "insufficient_data":
            recommendations.append({
                "title": "Log More Data",
                "category": "general",
                "reason": "Insufficient check-in history to generate personalized recommendations.",
                "action": "Keep logging your daily check-ins so the system can identify reliable patterns.",
                "priority": "medium",
                "evidence": {
                    "metric": "history",
                    "value": 0,
                    "target": 4,
                    "trend": "insufficient_data"
                }
            })
            return {
                "period": context.get("period"),
                "recommendations": recommendations
            }

        # 3. Generate from Weaknesses (High Priority)
        for weakness in analysis.get("weaknesses", []):
            if weakness["area"] == "Sleep":
                recommendations.append({
                    "title": "Improve Sleep Consistency",
                    "category": "sleep",
                    "reason": "Average sleep is currently below the optimal baseline.",
                    "action": "Try keeping a more consistent sleep schedule and aim toward the application's 8.0 hour reference target.",
                    "priority": "high",
                    "evidence": {
                        "metric": weakness["metric"],
                        "value": weakness["value"],
                        "target": 8.0,
                        "trend": "unknown"
                    }
                })
            elif weakness["area"] == "Habits":
                recommendations.append({
                    "title": "Rebuild Habit Consistency",
                    "category": "habits",
                    "reason": "Habit completion rate has dipped below optimal levels.",
                    "action": "Focus on completing just one core habit today to rebuild your momentum.",
                    "priority": "high",
                    "evidence": {
                        "metric": weakness["metric"],
                        "value": weakness["value"],
                        "target": 80, # 80% is the strength threshold
                        "trend": "unknown"
                    }
                })
            elif weakness["area"] == "Mood":
                recommendations.append({
                    "title": "Address Declining Mood",
                    "category": "mood",
                    "reason": "Average mood is trending low.",
                    "action": "Review your recent journal entries to identify stressors, or engage in a relaxing activity today.",
                    "priority": "high",
                    "evidence": {
                        "metric": weakness["metric"],
                        "value": weakness["value"],
                        "target": 7.5,
                        "trend": "unknown"
                    }
                })

        # 4. Generate from Trends (High/Medium Priority)
        for trend in analysis.get("trends", []):
            if trend["direction"] == "declining":
                # Only add if we didn't already add a weakness for it
                if not any(r["category"] == trend["metric"].lower() for r in recommendations):
                    recommendations.append({
                        "title": f"Reverse {trend['metric']} Decline",
                        "category": trend["metric"].lower(),
                        "reason": f"Your {trend['metric']} has been declining recently.",
                        "action": f"Pay extra attention to your {trend['metric']} over the next few days to stabilize the trend.",
                        "priority": "high",
                        "evidence": {
                            "metric": trend["metric"],
                            "value": trend["change"],
                            "target": 0,
                            "trend": "declining"
                        }
                    })

        # 5. Check raw metrics (Water, Productivity, Goals) (Medium Priority)
        water_avg = context.get("water", {}).get("average_intake_ml", 0)
        if water_avg > 0 and water_avg < 2000:
            recommendations.append({
                "title": "Increase Hydration",
                "category": "water",
                "reason": "Average water intake is consistently below the application's 2000ml target.",
                "action": "Increase daily water intake gradually toward the application's hydration target.",
                "priority": "medium",
                "evidence": {
                    "metric": "average_intake_ml",
                    "value": water_avg,
                    "target": 2000,
                    "trend": "unknown"
                }
            })

        prod = context.get("productivity", {})
        focus_time = prod.get("study_hours", 0) + prod.get("work_hours", 0)
        if focus_time < 2 and context["period"]["days"] >= 7:
            recommendations.append({
                "title": "Boost Deep Work",
                "category": "productivity",
                "reason": "Total focus time has been relatively low.",
                "action": "Try scheduling a dedicated 1-hour block of uninterrupted deep work tomorrow.",
                "priority": "medium",
                "evidence": {
                    "metric": "focus_hours",
                    "value": round(focus_time, 1),
                    "target": 5,
                    "trend": "unknown"
                }
            })

        # Goals check
        goals = context.get("goals", {})
        if goals.get("pending", 0) > 0 and goals.get("completed", 0) == 0:
             recommendations.append({
                "title": "Make Progress on Goals",
                "category": "goals",
                "reason": "You have pending goals but no recent completions.",
                "action": "Break down one of your pending goals into smaller daily tasks.",
                "priority": "medium",
                "evidence": {
                    "metric": "completed_goals",
                    "value": goals.get("completed"),
                    "target": 1,
                    "trend": "unknown"
                }
            })

        # 6. Preserve Strengths (Low Priority)
        if len(recommendations) < 5:
            for strength in analysis.get("strengths", []):
                # Don't duplicate categories
                if not any(r["category"] == strength["area"].lower() for r in recommendations):
                    recommendations.append({
                        "title": f"Maintain {strength['area']}",
                        "category": strength["area"].lower(),
                        "reason": f"You've established a strong baseline in {strength['area']}.",
                        "action": f"Keep utilizing your current routines to preserve your {strength['area']} momentum.",
                        "priority": "low",
                        "evidence": {
                            "metric": strength["metric"],
                            "value": strength["value"],
                            "target": strength["value"],
                            "trend": "stable"
                        }
                    })

        # 7. Sort by priority (high -> medium -> low)
        priority_map = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(key=lambda x: priority_map.get(x["priority"], 3))

        # 8. Bound output to max 5 recommendations
        return {
            "period": context.get("period"),
            "recommendations": recommendations[:5]
        }
