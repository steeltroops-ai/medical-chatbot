from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from ..models import ChatMessage
from .. import db
from ..services.openai_service import get_openai_response

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/message', methods=['POST'])
def send_message():
    """
    Process a chat message from the user and get a response from OpenAI.
    """
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'error': 'Message is required'}), 400
    
    # Get response from OpenAI
    try:
        # Get response from OpenAI first to avoid saving failed messages
        bot_response = get_openai_response(data['message'])
        
        # Define error phrases that indicate different types of errors
        service_errors = [
            "service configuration error",
            "service authentication error",
            "contact support"
        ]
        temporary_errors = [
            "high demand",
            "temporarily unavailable",
            "try again in a few moments",
            "try again in a minute"
        ]
        
        # Check for different types of error responses
        response_lower = bot_response.lower()
        if any(error in response_lower for error in service_errors):
            return jsonify({
                'error': bot_response,
                'error_type': 'service_error'
            }), 500
        elif any(error in response_lower for error in temporary_errors):
            return jsonify({
                'error': bot_response,
                'error_type': 'temporary_error'
            }), 503

        # Process authenticated users
        if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
            try:
                try:
                    # Save user message to database
                    user_message = ChatMessage(
                        user_id=current_user.id,
                        content=data['message'],
                        is_bot=False
                    )
                    db.session.add(user_message)
                    db.session.flush()  # Get user message ID

                    # Save bot message to database
                    bot_message = ChatMessage(
                        user_id=current_user.id,
                        content=bot_response,
                        is_bot=True
                    )
                    db.session.add(bot_message)
                    db.session.commit()  # Commit both messages

                    return jsonify({
                        'message': bot_response,
                        'message_id': bot_message.id
                    }), 200
                except Exception as e:
                    db.session.rollback()
                    current_app.logger.error(f"Database error when saving messages: {str(e)}")
                    return jsonify({
                        'error': 'Failed to save messages to database',
                        'message': bot_response,
                        'message_id': 0
                    }), 200  # Still return 200 with the response
                    
            except Exception as db_error:
                db.session.rollback()
                current_app.logger.error(f"Database error: {str(db_error)}")
                # Still return the response even if saving to DB failed
                return jsonify({
                    'message': bot_response,
                    'message_id': 0
                }), 200
        else:
            # Return response without database entry for unauthenticated users
            return jsonify({
                'message': bot_response,
                'message_id': 0
            }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in send_message: {str(e)}")
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/history', methods=['GET'])
@login_required
def get_chat_history():
    """Get chat history for the authenticated user"""
    try:
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
    except Exception as e:
        current_app.logger.error(f"Error in get_chat_history: {str(e)}")
        return jsonify({'error': str(e), 'history': []}), 500

@chat_bp.route('/message/<int:message_id>', methods=['DELETE'])
@login_required
def delete_message(message_id):
    """Delete a specific message from the chat history"""
    try:
        # Find message
        message = ChatMessage.query.filter_by(id=message_id, user_id=current_user.id).first()
        
        # Check if message exists
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        # Delete message
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({'message': 'Message deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in delete_message: {str(e)}")
        return jsonify({'error': str(e)}), 500