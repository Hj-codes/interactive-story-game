import uuid
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from database.db_manager import db_manager
from config import MAX_CONTEXT_LENGTH


class GameState:
    """Manages the state of an interactive story game session."""
    
    def __init__(self, session_id: str = None, **kwargs):
        self.session_id = session_id or self.generate_session_id()
        self.story_context = kwargs.get('story_context', '')
        self.current_story = kwargs.get('current_story', '')
        self.choices_history = kwargs.get('choices_history', [])
        self.character_info = kwargs.get('character_info', {
            "name": "Player",
            "traits": [],
            "inventory": []
        })
        self.current_choices = kwargs.get('current_choices', [])
        self.created_at = kwargs.get('created_at', datetime.now().isoformat())
        self.updated_at = kwargs.get('updated_at', datetime.now().isoformat())
    
    @staticmethod
    def generate_session_id() -> str:
        """Generate a unique session ID."""
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_save_id() -> str:
        """Generate a unique save ID."""
        return str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the game state to a dictionary for JSON serialization."""
        return {
            'session_id': self.session_id,
            'story_context': self.story_context,
            'current_story': self.current_story,
            'choices_history': self.choices_history,
            'character_info': self.character_info,
            'current_choices': self.current_choices,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GameState':
        """Create a GameState instance from a dictionary."""
        return cls(
            session_id=data.get('session_id'),
            story_context=data.get('story_context', ''),
            current_story=data.get('current_story', ''),
            choices_history=data.get('choices_history', []),
            character_info=data.get('character_info', {
                "name": "Player",
                "traits": [],
                "inventory": []
            }),
            current_choices=data.get('current_choices', []),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    def save_to_database(self, initial_story: str = None, initial_choices: list = None) -> bool:
        """Save the current game state to the database."""
        try:
            # Check if session exists
            existing_session = db_manager.get_game_session(self.session_id)
            
            if existing_session:
                # Update existing session
                return db_manager.update_game_session(
                    self.session_id,
                    self.story_context,
                    self.current_story,
                    self.choices_history,
                    self.current_choices,
                    self.character_info
                )
            else:
                # Create new session (with optional custom story)
                return db_manager.create_game_session(
                    self.session_id, 
                    self.character_info,
                    initial_story=initial_story,
                    initial_choices=initial_choices
                )
                
        except Exception as e:
            print(f"Error saving game state to database: {e}")
            return False
    
    @classmethod
    def load_from_database(cls, session_id: str) -> Optional['GameState']:
        """Load a game state from the database."""
        try:
            session_data = db_manager.get_game_session(session_id)
            if session_data:
                return cls.from_dict({
                    'session_id': session_data['id'],
                    'story_context': session_data['story_context'],
                    'current_story': session_data['current_story'],
                    'choices_history': session_data['choices_history'],
                    'character_info': session_data['character_info'],
                    'current_choices': session_data['current_choices'],
                    'created_at': session_data['created_at'],
                    'updated_at': session_data['updated_at']
                })
            return None
            
        except Exception as e:
            print(f"Error loading game state from database: {e}")
            return None
    
    def add_choice_to_history(self, choice: str, story_segment: str):
        """Add a player choice and resulting story to the history."""
        choice_entry = {
            'choice': choice,
            'story_segment': story_segment,
            'timestamp': datetime.now().isoformat()
        }
        self.choices_history.append(choice_entry)
        self.updated_at = datetime.now().isoformat()
        # Keep current_story aligned with the latest segment
        self.current_story = story_segment
    
    def update_story_context(self, max_length: int = MAX_CONTEXT_LENGTH):
        """Update rolling story context without duplicating the latest segment.

        The latest generated segment is stored both as `current_story` and as the
        last element of `choices_history`. To avoid duplication, build context
        primarily from history segments and only include `current_story` when
        it's not already the most recent history entry (e.g., initial state).
        """
        segments: List[str] = []
        if not self.choices_history:
            # Initial state: no history yet, use current_story only
            if self.current_story:
                segments.append(self.current_story)
        else:
            last_segment = self.choices_history[-1].get('story_segment', '').strip()
            # Include current_story only if it differs from the last history segment
            if self.current_story and self.current_story.strip() != last_segment:
                segments.append(self.current_story)
            # Append all history segments in order
            for entry in self.choices_history:
                seg = entry.get('story_segment', '')
                if seg:
                    segments.append(seg)

        full_context = " ".join(segments).strip()

        if len(full_context) > max_length:
            # Prefer trimming on sentence boundaries from the end
            sentences = full_context.split('. ')
            trimmed_story = ""
            for sentence in reversed(sentences):
                test_story = (sentence + '. ' + trimmed_story).strip()
                if len(test_story) <= max_length:
                    trimmed_story = test_story
                else:
                    break
            self.story_context = trimmed_story.strip() if trimmed_story else full_context[-max_length:]
        else:
            self.story_context = full_context
    
    def update_character_trait(self, trait: str):
        """Add a character trait if it doesn't already exist."""
        if trait not in self.character_info.get('traits', []):
            self.character_info.setdefault('traits', []).append(trait)
            self.updated_at = datetime.now().isoformat()
    
    def add_to_inventory(self, item: str):
        """Add an item to the character's inventory."""
        self.character_info.setdefault('inventory', []).append(item)
        self.updated_at = datetime.now().isoformat()
    
    def save_game(self, save_name: str) -> Optional[str]:
        """Save the current game state with a custom name."""
        try:
            save_id = self.generate_save_id()
            game_state = self.to_dict()
            
            success = db_manager.save_game(save_id, self.session_id, save_name, game_state)
            return save_id if success else None
            
        except Exception as e:
            print(f"Error saving game: {e}")
            return None
    
    @classmethod
    def load_saved_game(cls, save_id: str) -> Optional['GameState']:
        """Load a game state from a saved game."""
        try:
            saved_game = db_manager.load_game(save_id)
            if saved_game:
                game_state = saved_game['game_state']
                return cls.from_dict(game_state)
            return None
            
        except Exception as e:
            print(f"Error loading saved game: {e}")
            return None
    
    def get_recent_context(self, num_choices: int = 3) -> str:
        """Get recent story context for AI prompts without duplication.

        Returns the rolling `story_context` trimmed to the configured maximum
        length. The `num_choices` parameter is retained for compatibility but
        no longer used to append duplicate segments.
        """
        base = self.story_context or self.current_story or ""
        if not base:
            return ""
        return base[-MAX_CONTEXT_LENGTH:] if len(base) > MAX_CONTEXT_LENGTH else base


class SavedGame:
    """Represents a saved game."""
    
    def __init__(self, save_id: str, session_id: str, save_name: str, 
                 game_state: Dict, saved_at: str):
        self.save_id = save_id
        self.session_id = session_id
        self.save_name = save_name
        self.game_state = game_state
        self.saved_at = saved_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'save_id': self.save_id,
            'session_id': self.session_id,
            'save_name': self.save_name,
            'game_state': self.game_state,
            'saved_at': self.saved_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SavedGame':
        """Create instance from dictionary."""
        return cls(
            save_id=data['save_id'],
            session_id=data['session_id'],
            save_name=data['save_name'],
            game_state=data['game_state'],
            saved_at=data['saved_at']
        )
