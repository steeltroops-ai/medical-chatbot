import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()

# Load environment variables
load_dotenv()

# Import routes
from backend.routes.auth import auth_bp
from backend.routes.chat import chat_bp
from backend.routes.health import health_bp
from backend.error_handlers import register_error_handlers

def create_app():
    """
    Create and configure the Flask application.
    """
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object('backend.config.Config')
    
    # Set up logging
    configure_logging(app)
    
    # Initialize CORS with proper configuration
    configure_cors(app)
    
    # Initialize extensions
    initialize_extensions(app)
    
    # Set OpenAI API key from config
    openai.api_key = app.config.get('OPENAI_API_KEY')
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        app.logger.info("Database tables created")
    
    # Log application startup
    app.logger.info('Application startup complete')
    
    return app

def configure_logging(app):
    """Configure logging for the application."""
    if not app.debug:
        # Ensure log directory exists
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # Set up rotating file handler
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        # Set up console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        app.logger.addHandler(console_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('Application startup')

def configure_cors(app):
    """Configure CORS for the application."""
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 600  # Cache preflight requests for 10 minutes
        }
    })

    # Add OPTIONS response handler for all routes
    @app.after_request
    def after_request(response):
        if request.method == "OPTIONS":
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

def initialize_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

def register_blueprints(app):
    """Register Flask blueprints."""
    from .routes.auth import auth_bp
    from .routes.chat import chat_bp
    from .routes.health import health_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(health_bp, url_prefix='/api/health')