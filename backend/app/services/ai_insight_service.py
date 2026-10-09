import os
import json
from datetime import datetime, timezone
from app.services.growth_analysis_service import GrowthAnalysisService

class DummyAIProvider:
    """Mock provider for development without API keys"""
    @staticmethod
    def generate_insights(analysis_payload):
        if analysis_payload.get("summary", {}).get("trend") == "insufficient_data":
            return {
                "summary": "You are just getting started! Keep logging your daily check-ins to unlock personalized growth insights.",
                "insights": [],
                "encouragement": "Consistency is key to understanding your personal patterns."
            }
        
        trend = analysis_payload.get("summary", {}).get("trend", "stable")
        
        insights = []
        for strength in analysis_payload.get("strengths", []):
            insights.append({
                "title": f"Strong {strength['area']}",
                "category": "strength",
                "message": f"You've maintained a great baseline in {strength['area']} recently.",
                "evidence": {
                    "metric": strength['metric'],
                    "value": strength['value'],
                    "comparison": "baseline"
                },
                "priority": "medium"
            })
            
        for weakness in analysis_payload.get("weaknesses", []):
            insights.append({
                "title": f"Focus on {weakness['area']}",
                "category": "weakness",
                "message": f"Your {weakness['area']} metrics are dipping below optimal levels.",
                "evidence": {
                    "metric": weakness['metric'],
                    "value": weakness['value'],
                    "comparison": "baseline"
                },
                "priority": "high"
            })
            
        for corr in analysis_payload.get("correlations", []):
            insights.append({
                "title": f"Pattern: {corr['metric1']} & {corr['metric2']}",
                "category": "pattern",
                "message": f"There is a {corr['strength']} {corr['direction']} correlation.",
                "evidence": {
                    "metric": "correlation",
                    "value": corr['correlation'],
                    "comparison": "none"
                },
                "priority": "low"
            })
            
        return {
            "summary": f"Your data indicates a {trend} trend recently.",
            "insights": insights[:3], # Cap at 3
            "encouragement": "Every step forward counts!"
        }

SYSTEM_PROMPT = """
You are a personalized Growth AI. 
Analyze the following structured JSON describing a user's habits, mood, sleep, and life score.
Rules:
1. Explain meaningful patterns clearly and concisely.
2. Personalize language but avoid generic motivational filler.
3. Distinguish correlation from causation (say "associated with", not "causes").
4. NEVER invent metrics, achievements, goals, or user behaviors. 
5. NEVER invent numerical evidence. All numbers must match the supplied application data.
6. Avoid medical diagnosis.
7. Return ONLY valid JSON matching this schema:
{
  "summary": "String",
  "insights": [
    {
      "title": "String",
      "category": "strength|weakness|trend|pattern",
      "message": "String",
      "evidence": {"metric": "String", "value": Number, "comparison": "String"},
      "priority": "low|medium|high"
    }
  ],
  "encouragement": "String"
}
"""

class AIInsightService:
    provider = DummyAIProvider

    @classmethod
    def set_provider(cls, provider_class):
        cls.provider = provider_class

    @staticmethod
    def _validate_response(response):
        if not isinstance(response, dict):
            return False
        if "summary" not in response or "insights" not in response:
            return False
        if not isinstance(response["insights"], list):
            return False
            
        # Bound insight count (max 5)
        if len(response["insights"]) > 5:
            return False
        
        valid_categories = {"strength", "weakness", "trend", "pattern"}
        for insight in response["insights"]:
            if insight.get("category") not in valid_categories:
                return False
            if not insight.get("message") or not insight.get("title"):
                return False
                
        return True

    @staticmethod
    def generate_personalized_insights(user_id, days=30, analysis=None):
        # 1. Fetch analysis (accept pre-built to avoid redundant DB calls in overview)
        if analysis is None:
            analysis = GrowthAnalysisService.analyze(user_id, days)

        # 2. Check Insufficient Data First
        # If there is fundamentally not enough data to do an analysis,
        # we bypass the AI completely to prevent hallucinated trends.
        if analysis.get("summary", {}).get("trend") == "insufficient_data":
            return {
                "summary": "More check-ins are needed to generate personalized insights.",
                "insights": [],
                "encouragement": "Keep tracking your daily habits to unlock personal analytics!",
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

        # 3. Request insights from provider
        # (Data is already anonymized; it only contains numbers and stats, no emails/passwords)
        try:
            ai_response = AIInsightService.provider.generate_insights(analysis)
        except Exception:
            ai_response = None
            
        # 4. Validation and Hallucination Protection
        is_valid = False
        if ai_response:
            is_valid = AIInsightService._validate_response(ai_response)
            
        if not is_valid:
            # Safe Fallback
            ai_response = {
                "summary": "Your data is available, but personalized insights could not be generated right now.",
                "insights": [],
                "encouragement": None
            }
            
        ai_response["generated_at"] = datetime.now(timezone.utc).isoformat()
        return ai_response
