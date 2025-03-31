import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Initialize SQLAlchemy
db = SQLAlchemy()

# Initialize LoginManager
login_manager = LoginManager()

def create_app():
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object('config.Config')
    
    # Add root route
    @app.route('/')
    def index():
        return jsonify({"message": "Medical Chatbot API"}), 200
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # Set OpenAI API key
    openai.api_key = app.config['OPENAI_API_KEY']
    
    # Enable CORS
    CORS(app,
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000"],
                 "expose_headers": ["Content-Type", "Authorization"]
             }
         },
         supports_credentials=True
    )
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.chat import chat_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok"}), 200
    
    # Simple chat route without authentication for testing
    @app.route('/chat/message', methods=['POST'])
    def simple_chat():
        try:
            data = request.json
            message = data.get('message')
            
            if not message:
                return jsonify({'error': 'Message is required'}), 400

            # Use OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": message}
                ]
            )
            
            bot_response = response.choices[0].message.content
            
            return jsonify({
                'message': bot_response,
                'message_id': 1  # Dummy ID for testing
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)