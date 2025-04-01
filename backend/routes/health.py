from flask import Blueprint, jsonify, make_response, request

health_bp = Blueprint('health', __name__)

@health_bp.route('', methods=['GET', 'OPTIONS'])
@health_bp.route('/', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint that handles both GET and OPTIONS"""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
        
    return jsonify({
        "status": "ok",
        "message": "Service is running"
    }), 200