from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.monthly_report_service import MonthlyReportService

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_report():
    user_id = get_jwt_identity()
    
    try:
        year = int(request.args.get('year'))
        month = int(request.args.get('month'))
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid or missing year/month parameters"}), 400
        
    if month < 1 or month > 12:
        return jsonify({"message": "Month must be between 1 and 12"}), 400
        
    report, status_code = MonthlyReportService.get_monthly_report(user_id, year, month)
    if status_code != 200:
        return jsonify({"message": "Failed to generate report"}), status_code
        
    return jsonify(report), 200

@reports_bp.route('/weekly', methods=['GET'])
@jwt_required()
def get_weekly_report():
    user_id = get_jwt_identity()
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    period = request.args.get('period', 'this_week')
    
    from datetime import date, timedelta
    today = date.today()
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = date.fromisoformat(start_date_str)
        except Exception:
            start_date = None
            
    if end_date_str:
        try:
            end_date = date.fromisoformat(end_date_str)
        except Exception:
            end_date = None
            
    if not start_date or not end_date:
        if period == 'last_week':
            end_date = today - timedelta(days=today.weekday() + 1)
            start_date = end_date - timedelta(days=6)
        else: # this_week
            start_date = today - timedelta(days=today.weekday())
            end_date = today

    report, status_code = MonthlyReportService.get_weekly_report(user_id, start_date=start_date, end_date=end_date)
    if status_code != 200:
        return jsonify({"message": "Failed to generate report"}), status_code
        
    return jsonify(report), 200

