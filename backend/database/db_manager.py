import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from config import DATABASE_PATH


class DatabaseManager:
    """Manages database operations for the interactive story game."""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or DATABASE_PATH
        
    def get_connection(self) -> sqlite3.Connection:
        """Get a database connection with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def execute_query(self, query: str, params: tuple = ()) -> List[sqlite3.Row]:
        """Execute a SELECT query and return results."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute an INSERT/UPDATE/DELETE query and return affected rows."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount
    
    def create_game_session(self, session_id: str, character_info: Dict = None, 
                            initial_story: str = None, initial_choices: List[str] = None) -> bool:
        """Create a new game session with optional custom starting story."""
        try:
            # Use custom story or default
            if initial_story and initial_story.strip():
                starting_story = initial_story.strip()
            else:
                starting_story = ("You wake up in a mysterious place with no memory of how you got there. "
                                "The air is thick with an otherworldly energy, and three paths stretch before you, "
                                "each leading into the unknown. Your adventure begins now...")
            
            # Use provided choices or defaults
            if initial_choices and len(initial_choices) >= 3:
                starting_choices = initial_choices[:3]
            else:
                starting_choices = [
                    "Take the left path through the shadowy forest",
                    "Follow the middle path toward the glowing light", 
                    "Choose the right path up the rocky mountain trail"
                ]
            
            default_character = {
                "name": "Player",
                "traits": [],
                "inventory": []
            }
            
            character_info = character_info or default_character
            
            query = """
                INSERT INTO game_sessions 
                (id, story_context, current_story, choices_history, character_info, current_choices)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            
            params = (
                session_id,
                starting_story,  # story_context
                starting_story,  # current_story
                json.dumps([]),  # choices_history
                json.dumps(character_info),  # character_info
                json.dumps(starting_choices)  # current_choices
            )
            
            result = self.execute_update(query, params)
            return result > 0
            
        except Exception as e:
            print(f"Error creating game session: {e}")
            return False
    
    def get_game_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve a game session by ID."""
        try:
            query = "SELECT * FROM game_sessions WHERE id = ?"
            results = self.execute_query(query, (session_id,))
            
            if results:
                row = results[0]
                return {
                    'id': row['id'],
                    'story_context': row['story_context'],
                    'current_story': row['current_story'],
                    'choices_history': json.loads(row['choices_history']),
                    'character_info': json.loads(row['character_info']),
                    'current_choices': json.loads(row['current_choices']),
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                }
            return None
            
        except Exception as e:
            print(f"Error retrieving game session: {e}")
            return None
    
    def update_game_session(self, session_id: str, story_context: str, current_story: str, 
                          choices_history: List, current_choices: List, character_info: Dict = None) -> bool:
        """Update an existing game session."""
        try:
            query = """
                UPDATE game_sessions 
                SET story_context = ?, current_story = ?, choices_history = ?, 
                    current_choices = ?, character_info = ?, updated_at = ?
                WHERE id = ?
            """
            
            params = (
                story_context,
                current_story,
                json.dumps(choices_history),
                json.dumps(current_choices),
                json.dumps(character_info) if character_info is not None else json.dumps({"name": "Player", "traits": [], "inventory": []}),
                datetime.now().isoformat(),
                session_id
            )
            
            result = self.execute_update(query, params)
            return result > 0
            
        except Exception as e:
            print(f"Error updating game session: {e}")
            return False
    
    def save_game(self, save_id: str, session_id: str, save_name: str, game_state: Dict) -> bool:
        """Save a game state."""
        try:
            query = """
                INSERT OR REPLACE INTO saved_games (id, session_id, save_name, game_state)
                VALUES (?, ?, ?, ?)
            """
            
            params = (save_id, session_id, save_name, json.dumps(game_state))
            result = self.execute_update(query, params)
            return result > 0
            
        except Exception as e:
            print(f"Error saving game: {e}")
            return False
    
    def load_game(self, save_id: str) -> Optional[Dict]:
        """Load a saved game state."""
        try:
            query = "SELECT * FROM saved_games WHERE id = ?"
            results = self.execute_query(query, (save_id,))
            
            if results:
                row = results[0]
                return {
                    'id': row['id'],
                    'session_id': row['session_id'],
                    'save_name': row['save_name'],
                    'game_state': json.loads(row['game_state']),
                    'saved_at': row['saved_at']
                }
            return None
            
        except Exception as e:
            print(f"Error loading game: {e}")
            return None
    
    def list_saved_games(self, session_id: str = None) -> List[Dict]:
        """List all saved games, optionally filtered by session."""
        try:
            if session_id:
                query = "SELECT id, save_name, saved_at FROM saved_games WHERE session_id = ? ORDER BY saved_at DESC"
                params = (session_id,)
            else:
                query = "SELECT id, save_name, saved_at FROM saved_games ORDER BY saved_at DESC"
                params = ()
            
            results = self.execute_query(query, params)
            return [dict(row) for row in results]
            
        except Exception as e:
            print(f"Error listing saved games: {e}")
            return []

    def list_game_sessions(self, limit: int = 50) -> List[Dict]:
        """List all game sessions ordered by most recent."""
        try:
            query = """
                SELECT id, character_info, current_story, created_at, updated_at 
                FROM game_sessions 
                ORDER BY updated_at DESC 
                LIMIT ?
            """
            results = self.execute_query(query, (limit,))
            
            sessions = []
            for row in results:
                char_info = json.loads(row['character_info']) if row['character_info'] else {}
                sessions.append({
                    'id': row['id'],
                    'character_name': char_info.get('name', 'Player'),
                    'story_preview': row['current_story'][:150] + '...' if len(row['current_story']) > 150 else row['current_story'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                })
            return sessions
            
        except Exception as e:
            print(f"Error listing game sessions: {e}")
            return []

    def get_personality_profile(self, session_id: str) -> Optional[Dict]:
        """Retrieve a cached personality profile by session ID."""
        try:
            query = "SELECT * FROM personality_profiles WHERE session_id = ?"
            results = self.execute_query(query, (session_id,))

            if not results:
                return None

            row = results[0]
            return {
                'session_id': row['session_id'],
                'history_fingerprint': row['history_fingerprint'],
                'choices_analyzed': row['choices_analyzed'],
                'analysis_version': row['analysis_version'],
                'model_name': row['model_name'],
                'status': row['status'],
                'archetype': row['archetype'],
                'summary': row['summary'],
                'trait_scores': json.loads(row['trait_scores']) if row['trait_scores'] else {},
                'evidence': json.loads(row['evidence']) if row['evidence'] else [],
                'raw_response': json.loads(row['raw_response']) if row['raw_response'] else None,
                'last_error': row['last_error'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            }

        except Exception as e:
            print(f"Error retrieving personality profile: {e}")
            return None

    def mark_personality_profile_processing(
        self,
        session_id: str,
        history_fingerprint: str,
        choices_analyzed: int,
        model_name: str,
        analysis_version: int,
    ) -> bool:
        """Mark a personality profile as in progress for a session."""
        try:
            timestamp = datetime.now().isoformat()
            query = """
                INSERT INTO personality_profiles (
                    session_id, history_fingerprint, choices_analyzed, analysis_version,
                    model_name, status, archetype, summary, trait_scores, evidence,
                    raw_response, last_error, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, 'processing', '', '', '{}', '[]', NULL, NULL, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    history_fingerprint = excluded.history_fingerprint,
                    choices_analyzed = excluded.choices_analyzed,
                    analysis_version = excluded.analysis_version,
                    model_name = excluded.model_name,
                    status = 'processing',
                    archetype = '',
                    summary = '',
                    trait_scores = '{}',
                    evidence = '[]',
                    raw_response = NULL,
                    last_error = NULL,
                    updated_at = excluded.updated_at
            """
            params = (
                session_id,
                history_fingerprint,
                choices_analyzed,
                analysis_version,
                model_name,
                timestamp,
                timestamp,
            )
            return self.execute_update(query, params) > 0

        except Exception as e:
            print(f"Error marking personality profile as processing: {e}")
            return False

    def upsert_personality_profile(
        self,
        session_id: str,
        history_fingerprint: str,
        choices_analyzed: int,
        analysis_version: int,
        model_name: str,
        status: str,
        archetype: str,
        summary: str,
        trait_scores: Dict,
        evidence: List[Dict],
        raw_response: Optional[Dict] = None,
        last_error: Optional[str] = None,
    ) -> bool:
        """Create or update a personality profile."""
        try:
            timestamp = datetime.now().isoformat()
            query = """
                INSERT INTO personality_profiles (
                    session_id, history_fingerprint, choices_analyzed, analysis_version,
                    model_name, status, archetype, summary, trait_scores, evidence,
                    raw_response, last_error, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    history_fingerprint = excluded.history_fingerprint,
                    choices_analyzed = excluded.choices_analyzed,
                    analysis_version = excluded.analysis_version,
                    model_name = excluded.model_name,
                    status = excluded.status,
                    archetype = excluded.archetype,
                    summary = excluded.summary,
                    trait_scores = excluded.trait_scores,
                    evidence = excluded.evidence,
                    raw_response = excluded.raw_response,
                    last_error = excluded.last_error,
                    updated_at = excluded.updated_at
            """
            params = (
                session_id,
                history_fingerprint,
                choices_analyzed,
                analysis_version,
                model_name,
                status,
                archetype,
                summary,
                json.dumps(trait_scores),
                json.dumps(evidence),
                json.dumps(raw_response) if raw_response is not None else None,
                last_error,
                timestamp,
                timestamp,
            )
            return self.execute_update(query, params) > 0

        except Exception as e:
            print(f"Error upserting personality profile: {e}")
            return False


def init_database():
    """Initialize the database with required tables."""
    db_manager = DatabaseManager()
    
    # Read and execute the SQL initialization script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, 'init.sql')
    
    try:
        with open(sql_file, 'r') as f:
            sql_script = f.read()
        
        with db_manager.get_connection() as conn:
            conn.executescript(sql_script)
            conn.commit()
        
        print("Database initialized successfully")
        return True
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False


# Singleton instance
db_manager = DatabaseManager()
