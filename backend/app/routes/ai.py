import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.ai_context_service import AIContextService
from app.services.growth_analysis_service import GrowthAnalysisService
from app.services.ai_insight_service import AIInsightService
from app.services.recommendation_service import RecommendationService
from app.services.llm_service import LLMService
from app.services.life_memory_retrieval_service import LifeMemoryRetrievalService

ai_bp = Blueprint('ai', __name__)

def get_days_from_range(time_range):
    if time_range == '7d': return 7
    if time_range == '90d': return 90
    if time_range == '1y': return 365
    return 30

@ai_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    try:
        user_id = get_jwt_identity()
        time_range = request.args.get('timeRange', '30d')
        days = get_days_from_range(time_range)
        
        insights = AIInsightService.generate_personalized_insights(user_id, days)
        return jsonify(insights), 200
    except Exception as e:
        return jsonify({"error": "An internal error occurred while generating insights."}), 500

@ai_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    try:
        user_id = get_jwt_identity()
        time_range = request.args.get('timeRange', '30d')
        days = get_days_from_range(time_range)
        
        recommendations = RecommendationService.generate(user_id, days)
        return jsonify(recommendations), 200
    except Exception as e:
        return jsonify({"error": "An internal error occurred while generating recommendations."}), 500

@ai_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    try:
        user_id = get_jwt_identity()
        time_range = request.args.get('timeRange', '30d')
        days = get_days_from_range(time_range)

        # Build context and analysis once — share between both services
        # to avoid 4x redundant database traversals.
        context = AIContextService.build_user_context(user_id, days)
        analysis = GrowthAnalysisService.analyze(user_id, days)

        insights = AIInsightService.generate_personalized_insights(user_id, days, analysis=analysis)
        recommendations = RecommendationService.generate(user_id, days, context=context, analysis=analysis)
        
        overview = {
            "period": recommendations.get("period", insights.get("period")),
            "insights": insights,
            "recommendations": recommendations
        }
        
        return jsonify(overview), 200
    except Exception as e:
        return jsonify({"error": "An internal error occurred while generating the AI overview."}), 500

@ai_bp.route('/replay', methods=['POST'])
@jwt_required()
def get_replay():
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400

        # 1. Extract Intent
        intent_result = LLMService.extract_query_intent(query)
        
        intent = intent_result.get('intent', 'GENERAL_REPLAY')
        start_date_str = intent_result.get('start_date')
        end_date_str = intent_result.get('end_date')
        search_terms = intent_result.get('search_terms', [])
        
        from datetime import datetime
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else None
        except Exception:
            start_date = None
            
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else None
        except Exception:
            end_date = None

        # 2. Retrieve Context
        context = LifeMemoryRetrievalService.retrieve_context(user_id, search_terms, start_date, end_date, intent)
        
        # 3. Handle COMPARISON Intent Statistics
        if intent == "COMPARISON" and context['timeline']:
            total_mood = sum([c['mood_score'] for c in context['timeline'] if c.get('mood_score') is not None])
            mood_count = sum([1 for c in context['timeline'] if c.get('mood_score') is not None])
            context['comparison_stats'] = {
                "timeline_average_mood_score": round(total_mood / mood_count, 2) if mood_count > 0 else None,
                "total_timeline_events": len(context['timeline']),
                "total_goals": len(context['goals']),
                "total_achievements": len(context['achievements'])
            }

        # 4. Generate Advanced Replay
        from app.models import User
        user = User.query.get(user_id)
        user_preferences = {
            'ai_style': user.ai_style if user else 'Balanced',
            'ai_coaching': user.ai_coaching if user else 'Neutral',
            'ai_focus_areas': user.ai_focus_areas if user else None
        }
        replay = LLMService.generate_advanced_replay(query, context, intent, user_preferences=user_preferences)
        
        # 5. Attach retrieved context for the UI to display "Related Memories"
        replay['context'] = context
        
        return jsonify(replay), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred while generating the Life Replay."}), 500
