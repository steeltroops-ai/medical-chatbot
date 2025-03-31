from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import ChatMessage
from app import db
from services.openai_service import get_openai_response

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/message', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    
    # Validate input data
    if not data or not data.get('message'):
        return jsonify({'error': 'Message is required'}), 400
    
    # Save user message to database
    user_message = ChatMessage(
        user_id=current_user.id,
        content=data['message'],
        is_bot=False
    )
    db.session.add(user_message)
    db.session.commit()
    
    # Get response from OpenAI
    try:
        bot_response = get_openai_response(data['message'])
        
        # Save bot response to database
        bot_message = ChatMessage(
            user_id=current_user.id,
            content=bot_response,
            is_bot=True
        )
        db.session.add(bot_message)
        db.session.commit()
        
        return jsonify({
            'message': bot_response,
            'message_id': bot_message.id
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/history', methods=['GET'])
@login_required
def get_chat_history():
    # Get chat history for current user
    messages = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.timestamp).all()
    
    # Format messages
    history = [{
        'id': message.id,
        'content': message.content,
        'is_bot': message.is_bot,
        'timestamp': message.timestamp.isoformat()
    } for message in messages]
    
    return jsonify({'history': history}), 200

@chat_bp.route('/message/<int:message_id>', methods=['DELETE'])
@login_required
def delete_message(message_id):
    # Find message
    message = ChatMessage.query.filter_by(id=message_id, user_id=current_user.id).first()
    
    # Check if message exists
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    # Delete message
    db.session.delete(message)
    db.session.commit()
    
    return jsonify({'message': 'Message deleted successfully'}), 200