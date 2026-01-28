from flask import Blueprint, request, jsonify
from models.game_state import GameState
from services.ai_service import ai_service
from services.image_service import image_service
from database.db_manager import db_manager
import json

game_bp = Blueprint('game', __name__)


@game_bp.route('/start', methods=['POST'])
def start_game():
    """Start a new game session."""
    try:
        # Get optional character customization from request
        data = request.get_json() or {}
        character_name = data.get('character_name', 'Player')
        
        # Create new game state
        game_state = GameState()
        game_state.character_info['name'] = character_name
        
        # Save initial state to database (this creates the session with starting story)
        success = game_state.save_to_database()
        
        if success:
            # Reload the game state from database to get the starting story and choices
            # that were set by create_game_session()
            game_state = GameState.load_from_database(game_state.session_id)
            
            if game_state:
                # Generate a starting image for the first scene
                starting_image_prompt = "A mystical crossroads at the edge of an enchanted forest, with three diverging paths, one leading to shadowy trees, one towards a mysterious light, and one up a rocky mountain, fantasy digital art, cinematic lighting"
                starting_image = image_service.generate_image(starting_image_prompt)
                
                return jsonify({
                    'success': True,
                    'session_id': game_state.session_id,
                    'current_story': game_state.current_story,
                    'choices': game_state.current_choices,
                    'character_info': game_state.character_info,
                    'image': starting_image
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to load created game session'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create game session'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error starting game: {str(e)}'
        }), 500


@game_bp.route('/choice', methods=['POST'])
def make_choice():
    """Process a player's choice and generate story continuation."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        session_id = data.get('session_id')
        choice_index = data.get('choice_index')
        
        if not session_id or choice_index is None:
            return jsonify({
                'success': False,
                'error': 'session_id and choice_index are required'
            }), 400
        
        # Load game state
        game_state = GameState.load_from_database(session_id)
        if not game_state:
            return jsonify({
                'success': False,
                'error': 'Game session not found'
            }), 404
        
        # Validate choice index
        if choice_index < 0 or choice_index >= len(game_state.current_choices):
            return jsonify({
                'success': False,
                'error': 'Invalid choice index'
            }), 400
        
        # Get the selected choice
        selected_choice = game_state.current_choices[choice_index]
        
        # Generate story continuation using AI
        context = game_state.get_recent_context()
        new_story, new_choices, image_prompt = ai_service.generate_story_continuation(
            context, selected_choice, game_state.character_info
        )
        
        # Generate image based on the scene
        image_base64 = image_service.generate_image(image_prompt)
        
        # Update game state
        game_state.add_choice_to_history(selected_choice, new_story)
        game_state.current_story = new_story
        game_state.current_choices = new_choices
        game_state.update_story_context()
        
        # Save updated state
        success = game_state.save_to_database()
        
        if success:
            return jsonify({
                'success': True,
                'story': new_story,
                'choices': new_choices,
                'character_info': game_state.character_info,
                'session_id': session_id,
                'image': image_base64
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save game state'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing choice: {str(e)}'
        }), 500


@game_bp.route('/state/<session_id>', methods=['GET'])
def get_game_state(session_id):
    """Get current game state for a session."""
    try:
        game_state = GameState.load_from_database(session_id)
        
        if game_state:
            return jsonify({
                'success': True,
                'session_id': game_state.session_id,
                'current_story': game_state.current_story,
                'choices': game_state.current_choices,
                'character_info': game_state.character_info,
                'choices_history': game_state.choices_history,
                'created_at': game_state.created_at,
                'updated_at': game_state.updated_at
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Game session not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error retrieving game state: {str(e)}'
        }), 500


@game_bp.route('/save', methods=['POST'])
def save_game():
    """Save the current game state with a custom name."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        session_id = data.get('session_id')
        save_name = data.get('save_name', 'Unnamed Save')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        # Load current game state
        game_state = GameState.load_from_database(session_id)
        if not game_state:
            return jsonify({
                'success': False,
                'error': 'Game session not found'
            }), 404
        
        # Save the game
        save_id = game_state.save_game(save_name)
        
        if save_id:
            return jsonify({
                'success': True,
                'save_id': save_id,
                'save_name': save_name,
                'message': 'Game saved successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save game'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error saving game: {str(e)}'
        }), 500


@game_bp.route('/load/<save_id>', methods=['POST'])
def load_game(save_id):
    """Load a saved game state."""
    try:
        # Load the saved game
        game_state = GameState.load_saved_game(save_id)
        
        if game_state:
            # Save the loaded state as current session
            success = game_state.save_to_database()
            
            if success:
                return jsonify({
                    'success': True,
                    'session_id': game_state.session_id,
                    'current_story': game_state.current_story,
                    'choices': game_state.current_choices,
                    'character_info': game_state.character_info,
                    'message': 'Game loaded successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to restore game session'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'Saved game not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error loading game: {str(e)}'
        }), 500


@game_bp.route('/saves', methods=['GET'])
def list_saves():
    """List all saved games."""
    try:
        session_id = request.args.get('session_id')
        saved_games = db_manager.list_saved_games(session_id)
        
        return jsonify({
            'success': True,
            'saved_games': saved_games
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error listing saved games: {str(e)}'
        }), 500


@game_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@game_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
