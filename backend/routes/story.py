from flask import Blueprint, request, jsonify
from services.ai_service import ai_service
from models.game_state import GameState

story_bp = Blueprint('story', __name__)


@story_bp.route('/generate', methods=['POST'])
def generate_story():
    """Generate a story continuation based on provided context and choice."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        context = data.get('context', '')
        player_choice = data.get('choice', '')
        character_info = data.get('character_info', {})
        
        if not context or not player_choice:
            return jsonify({
                'success': False,
                'error': 'context and choice are required'
            }), 400
        
        # Generate story continuation
        story, choices = ai_service.generate_story_continuation(
            context, player_choice, character_info
        )
        
        return jsonify({
            'success': True,
            'story': story,
            'choices': choices
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error generating story: {str(e)}'
        }), 500


@story_bp.route('/validate', methods=['POST'])
def validate_story_response():
    """Validate a story response format."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        is_valid = ai_service.validate_response(data)
        
        return jsonify({
            'success': True,
            'valid': is_valid,
            'message': 'Response is valid' if is_valid else 'Response format is invalid'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error validating response: {str(e)}'
        }), 500


@story_bp.route('/context/<session_id>', methods=['GET'])
def get_story_context(session_id):
    """Get story context for a game session."""
    try:
        game_state = GameState.load_from_database(session_id)
        
        if game_state:
            # Ensure context is refreshed based on latest state
            game_state.update_story_context()
            context = game_state.get_recent_context()
            return jsonify({
                'success': True,
                'context': context,
                'story_context': game_state.story_context,
                'choices_count': len(game_state.choices_history)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Game session not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error retrieving story context: {str(e)}'
        }), 500


@story_bp.route('/history/<session_id>', methods=['GET'])
def get_story_history(session_id):
    """Get the choice and story history for a game session."""
    try:
        game_state = GameState.load_from_database(session_id)
        
        if game_state:
            return jsonify({
                'success': True,
                'choices_history': game_state.choices_history,
                'current_story': game_state.current_story,
                'character_info': game_state.character_info
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Game session not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error retrieving story history: {str(e)}'
        }), 500


@story_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@story_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
