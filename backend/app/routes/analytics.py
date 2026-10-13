from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.analytics_service import AnalyticsService
from app.services.correlation_service import CorrelationService
from app.services.time_analysis_service import TimeAnalysisService
from app.services.llm_service import LLMService

analytics_bp = Blueprint('analytics', __name__)

def get_days_from_range(time_range):
    if time_range == '7d': return 7
    if time_range == '14d': return 14
    if time_range == '90d': return 90
    if time_range == '1y': return 365
    return 30

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_overview(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/life-score', methods=['GET'])
@jwt_required()
def get_life_score():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_life_score_analytics(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/mood', methods=['GET'])
@jwt_required()
def get_mood():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_mood_analytics(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/habits', methods=['GET'])
@jwt_required()
def get_habits():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_habit_analytics(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/productivity', methods=['GET'])
@jwt_required()
def get_productivity():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_productivity_analytics(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/sleep', methods=['GET'])
@jwt_required()
def get_sleep():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_sleep_analytics(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/water', methods=['GET'])
@jwt_required()
def get_water():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    response_data, status_code = AnalyticsService.get_water_analytics(user_id, days)
    return jsonify(response_data), status_code

@analytics_bp.route('/goals', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = int(get_jwt_identity())
    response_data, status_code = AnalyticsService.get_goal_progress(user_id)
    return jsonify(response_data), status_code

@analytics_bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    user_id = int(get_jwt_identity())
    response_data, status_code = AnalyticsService.get_achievements(user_id)
    return jsonify(response_data), status_code

@analytics_bp.route('/correlations', methods=['GET'])
@jwt_required()
def get_correlations():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    include_ai = request.args.get('ai', 'false').lower() == 'true'
    
    correlations = CorrelationService.get_correlations(user_id, days)
    
    response = {
        "correlations": correlations
    }
    
    if include_ai and correlations:
        ai_interpretation = LLMService.interpret_correlations(correlations)
        response["ai_interpretation"] = ai_interpretation
        
    return jsonify(response), 200

@analytics_bp.route('/time-analysis', methods=['GET'])
@jwt_required()
def get_time_analysis():
    user_id = int(get_jwt_identity())
    days = get_days_from_range(request.args.get('timeRange', '30d'))
    include_ai = request.args.get('ai', 'false').lower() == 'true'
    
    analysis = TimeAnalysisService.analyze(user_id, days)
    
    if include_ai and analysis.get('daily'):
        analysis["ai_insight"] = LLMService.interpret_time_analysis(analysis)
    else:
        analysis["ai_insight"] = None
        
    return jsonify(analysis), 200
