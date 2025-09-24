from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.game import game_bp
from routes.story import story_bp
from database.db_manager import init_database
from config import DEBUG, SECRET_KEY

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
CORS(app)

# Register blueprints
app.register_blueprint(game_bp, url_prefix='/api/game')
app.register_blueprint(story_bp, url_prefix='/api/story')


@app.route('/')
def index():
    """Root endpoint."""
    return jsonify({
        'message': 'Interactive Story Game API',
        'version': '1.0.0',
        'endpoints': {
            'game': '/api/game/*',
            'story': '/api/story/*'
        }
    })


@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'Interactive Story Game API is running'
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested resource was not found on this server.'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500


@app.errorhandler(400)
def bad_request(error):
    """Handle 400 errors."""
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': 'The request could not be understood by the server.'
    }), 400


if __name__ == '__main__':
    # Initialize database on startup
    print("Initializing database...")
    init_success = init_database()
    
    if init_success:
        print("Database initialized successfully")
    else:
        print("Warning: Database initialization failed")
    
    print("Starting Interactive Story Game API...")
    print(f"Debug mode: {DEBUG}")
    print("Server will be available at: http://localhost:5000")
    print("API endpoints:")
    print("  - POST /api/game/start - Start new game")
    print("  - POST /api/game/choice - Make a choice")
    print("  - GET /api/game/state/<session_id> - Get game state")
    print("  - POST /api/game/save - Save game")
    print("  - POST /api/game/load/<save_id> - Load game")
    print("  - GET /api/game/saves - List saved games")
    print("  - POST /api/story/generate - Generate story")
    print("  - GET /api/health - Health check")
    
    app.run(debug=DEBUG, host='0.0.0.0', port=5000)
