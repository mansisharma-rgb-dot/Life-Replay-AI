from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import NotificationService
from app.services.smart_notification_service import SmartNotificationService

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifs = NotificationService.get_user_notifications(user_id)
    
    result = []
    for n in notifs:
        result.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "severity": n.severity,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "metadata_json": n.metadata_json
        })
        
    return jsonify({"success": True, "notifications": result}), 200

@notifications_bp.route('/smart', methods=['GET'])
@jwt_required()
def generate_smart_notifications():
    user_id = get_jwt_identity()
    
    # 1. Trigger generation
    SmartNotificationService.generate_smart_notifications(user_id)
    
    # 2. Fetch all user notifications (including the ones just generated)
    notifs = NotificationService.get_user_notifications(user_id)
    
    # 3. Get summary
    summary = SmartNotificationService.get_summary(user_id)
    
    result = []
    for n in notifs:
        result.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "severity": n.severity,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "metadata_json": n.metadata_json
        })
        
    from datetime import datetime, timezone
    return jsonify({
        "success": True, 
        "notifications": result,
        "summary": summary,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }), 200

@notifications_bp.route('/read/<int:notif_id>', methods=['POST'])
@jwt_required()
def mark_read(notif_id):
    user_id = get_jwt_identity()
    success = NotificationService.mark_as_read(user_id, notif_id)
    return jsonify({"success": success}), 200 if success else 404

@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    NotificationService.mark_all_read(user_id)
    return jsonify({"success": True}), 200
