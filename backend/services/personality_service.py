import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from config import (
    PERSONALITY_ANALYSIS_MAX_INPUT_CHARS,
    PERSONALITY_ANALYSIS_MODEL,
    PERSONALITY_ANALYSIS_VERSION,
)
from database.db_manager import db_manager
from models.game_state import GameState
from services.ai_service import ai_service


TRAIT_KEYS = ('bravery', 'empathy', 'cunning', 'honor', 'curiosity', 'caution')
PROCESSING_TTL_SECONDS = 90


class PersonalityAnalysisError(Exception):
    """Base exception for personality analysis failures."""


class AnalysisInProgressError(PersonalityAnalysisError):
    """Raised when the requested analysis is already in progress."""


class AIAnalysisUnavailableError(PersonalityAnalysisError):
    """Raised when AI analysis cannot be completed and no cache is usable."""


class PersonalityService:
    """Generate and cache personality analysis for a game session."""

    def __init__(self):
        self.system_prompt = (
            "You analyze a player's narrative decision-making style. "
            "Always return valid JSON with no markdown."
        )

    def get_cached_profile(self, game_state: GameState) -> Optional[Dict[str, Any]]:
        """Return the cached profile with staleness metadata for the current session."""
        cached = db_manager.get_personality_profile(game_state.session_id)
        if not cached or cached.get('status') != 'completed':
            return None

        current_fingerprint = game_state.get_history_fingerprint()
        profile = self._serialize_profile(cached)
        profile['is_stale'] = cached.get('history_fingerprint') != current_fingerprint
        return profile

    def analyze_session(self, game_state: GameState, force_refresh: bool = False) -> Dict[str, Any]:
        """Analyze the session history or return a cached result."""
        if not game_state.has_personality_source_data():
            raise PersonalityAnalysisError('At least one choice is required for personality analysis')

        history_fingerprint = game_state.get_history_fingerprint()
        choices_analyzed = len(game_state.choices_history)
        cached = db_manager.get_personality_profile(game_state.session_id)

        if self._is_processing_for_current_history(cached, history_fingerprint):
            raise AnalysisInProgressError('Personality analysis already in progress')

        if (
            cached
            and cached.get('status') == 'completed'
            and cached.get('history_fingerprint') == history_fingerprint
            and not force_refresh
        ):
            return {
                'profile': self._serialize_profile(cached),
                'cache_status': 'cached',
            }

        if not db_manager.mark_personality_profile_processing(
            game_state.session_id,
            history_fingerprint,
            choices_analyzed,
            PERSONALITY_ANALYSIS_MODEL,
            PERSONALITY_ANALYSIS_VERSION,
        ):
            raise AIAnalysisUnavailableError('Unable to reserve personality analysis')

        fallback_profile = (
            self._serialize_profile(cached, cache_status='stale_fallback')
            if cached and cached.get('status') == 'completed'
            else None
        )

        try:
            raw_response = self._request_analysis(game_state)
            normalized = self._normalize_analysis(raw_response, game_state)

            db_manager.upsert_personality_profile(
                session_id=game_state.session_id,
                history_fingerprint=history_fingerprint,
                choices_analyzed=choices_analyzed,
                analysis_version=PERSONALITY_ANALYSIS_VERSION,
                model_name=PERSONALITY_ANALYSIS_MODEL,
                status='completed',
                archetype=normalized['archetype'],
                summary=normalized['summary'],
                trait_scores=normalized['trait_scores'],
                evidence=normalized['evidence'],
                raw_response=raw_response,
                last_error=None,
            )

            refreshed = db_manager.get_personality_profile(game_state.session_id)
            return {
                'profile': self._serialize_profile(refreshed or {
                    **normalized,
                    'session_id': game_state.session_id,
                    'choices_analyzed': choices_analyzed,
                    'updated_at': datetime.now().isoformat(),
                }, cache_status='generated'),
                'cache_status': 'generated',
            }

        except Exception as exc:
            db_manager.upsert_personality_profile(
                session_id=game_state.session_id,
                history_fingerprint=history_fingerprint,
                choices_analyzed=choices_analyzed,
                analysis_version=PERSONALITY_ANALYSIS_VERSION,
                model_name=PERSONALITY_ANALYSIS_MODEL,
                status='failed',
                archetype='',
                summary='',
                trait_scores={},
                evidence=[],
                raw_response=None,
                last_error=str(exc),
            )

            if fallback_profile:
                fallback_profile['warning'] = 'Showing the most recent completed analysis.'
                return {
                    'profile': fallback_profile,
                    'cache_status': 'stale_fallback',
                    'warning': fallback_profile['warning'],
                }

            raise AIAnalysisUnavailableError('Personality analysis service unavailable') from exc

    def _request_analysis(self, game_state: GameState) -> Dict[str, Any]:
        """Request analysis from the AI provider or return a deterministic mock."""
        if not ai_service.api_key or ai_service.api_key == 'your_api_key_here':
            return self._get_mock_analysis(game_state)

        response = ai_service.request_structured_json(
            system_prompt=self.system_prompt,
            user_prompt=self._build_user_prompt(game_state),
            fallback=None,
            model=PERSONALITY_ANALYSIS_MODEL,
        )
        if not isinstance(response, dict):
            raise AIAnalysisUnavailableError('Invalid AI response')
        return response

    def _build_user_prompt(self, game_state: GameState) -> str:
        """Build the structured prompt payload from the game history."""
        character_info = json.dumps(game_state.character_info, ensure_ascii=True)
        history_payload = self._format_history_payload(game_state.choices_history)
        return f"""Analyze this interactive-story session and infer the player's decision-making style.

Character:
{character_info}

History metadata:
- total_choices: {len(game_state.choices_history)}

Choice history:
{history_payload}

Score these traits from 0 to 100:
- bravery
- empathy
- cunning
- honor
- curiosity
- caution

Return JSON:
{{
  "archetype": "short title",
  "summary": "120-220 word narrative summary",
  "trait_scores": {{
    "bravery": 0,
    "empathy": 0,
    "cunning": 0,
    "honor": 0,
    "curiosity": 0,
    "caution": 0
  }},
  "evidence": [
    {{
      "choice": "player choice text",
      "signal": "why this choice matters",
      "trait": "dominant trait shown"
    }}
  ]
}}

Rules:
- Use all available choices.
- Evidence length must be 2 to 3 items when history allows.
- Scores must be integers.
- Do not include markdown or commentary outside the JSON.
"""

    def _format_history_payload(self, history: List[Dict[str, Any]]) -> str:
        """Format choice history while keeping the prompt within a fixed size budget."""
        if not history:
            return '[]'

        base_excerpt = 180
        recent_excerpt = 320
        payload: List[Dict[str, Any]] = []

        for idx, entry in enumerate(history):
            is_recent = idx >= max(len(history) - 5, 0)
            excerpt_size = recent_excerpt if is_recent else base_excerpt
            payload.append({
                'index': idx + 1,
                'choice': entry.get('choice', ''),
                'story_segment_excerpt': self._excerpt(entry.get('story_segment', ''), excerpt_size),
                'timestamp': entry.get('timestamp', ''),
            })

        serialized = json.dumps(payload, ensure_ascii=True, indent=2)
        if len(serialized) <= PERSONALITY_ANALYSIS_MAX_INPUT_CHARS:
            return serialized

        compact_payload = []
        compact_excerpt = 100
        for entry in payload:
            compact_payload.append({
                **entry,
                'story_segment_excerpt': self._excerpt(entry.get('story_segment_excerpt', ''), compact_excerpt),
            })

        compact_serialized = json.dumps(compact_payload, ensure_ascii=True, indent=2)
        if len(compact_serialized) <= PERSONALITY_ANALYSIS_MAX_INPUT_CHARS:
            return compact_serialized

        # Final fallback: preserve all choices and timestamps with minimal excerpts.
        minimal_payload = [
            {
                'index': entry['index'],
                'choice': entry['choice'],
                'story_segment_excerpt': self._excerpt(entry.get('story_segment_excerpt', ''), 40),
                'timestamp': entry['timestamp'],
            }
            for entry in compact_payload
        ]
        return json.dumps(minimal_payload, ensure_ascii=True, indent=2)

    def _normalize_analysis(self, response: Dict[str, Any], game_state: GameState) -> Dict[str, Any]:
        """Normalize and validate the AI response."""
        trait_scores = response.get('trait_scores', {}) if isinstance(response, dict) else {}
        normalized_scores = {
            trait: self._normalize_score(trait_scores.get(trait))
            for trait in TRAIT_KEYS
        }

        archetype = response.get('archetype') if isinstance(response, dict) else None
        summary = response.get('summary') if isinstance(response, dict) else None
        evidence = response.get('evidence', []) if isinstance(response, dict) else []

        if not archetype or not isinstance(archetype, str):
            archetype = self._derive_archetype(normalized_scores)

        if not summary or not isinstance(summary, str):
            summary = self._build_fallback_summary(game_state, normalized_scores)
        else:
            summary = summary.strip()[:600]

        normalized_evidence = self._normalize_evidence(evidence, game_state)

        return {
            'archetype': archetype.strip()[:80],
            'summary': summary,
            'trait_scores': normalized_scores,
            'evidence': normalized_evidence,
        }

    def _normalize_evidence(self, evidence: Any, game_state: GameState) -> List[Dict[str, str]]:
        """Normalize evidence items and fall back to recent choices when necessary."""
        normalized: List[Dict[str, str]] = []
        if isinstance(evidence, list):
            for item in evidence:
                if not isinstance(item, dict):
                    continue
                choice = str(item.get('choice', '')).strip()
                signal = str(item.get('signal', '')).strip()
                trait = str(item.get('trait', '')).strip().lower()
                if not choice or not signal or trait not in TRAIT_KEYS:
                    continue
                normalized.append({
                    'choice': choice[:220],
                    'signal': signal[:220],
                    'trait': trait,
                })
                if len(normalized) == 3:
                    break

        if normalized:
            return normalized

        recent_history = game_state.choices_history[-min(3, len(game_state.choices_history)):]
        fallback: List[Dict[str, str]] = []
        for idx, entry in enumerate(recent_history):
            fallback.append({
                'choice': entry.get('choice', '')[:220],
                'signal': 'This decision contributed to the overall personality pattern.',
                'trait': TRAIT_KEYS[idx % len(TRAIT_KEYS)],
            })
        return fallback

    def _serialize_profile(self, profile: Dict[str, Any], cache_status: Optional[str] = None) -> Dict[str, Any]:
        """Return the API-safe profile shape."""
        derived_cache_status = cache_status
        if derived_cache_status is None:
            derived_cache_status = 'cached' if profile.get('status') == 'completed' else 'stale_fallback'

        return {
            'session_id': profile.get('session_id'),
            'archetype': profile.get('archetype', ''),
            'summary': profile.get('summary', ''),
            'trait_scores': {
                trait: self._normalize_score(profile.get('trait_scores', {}).get(trait))
                for trait in TRAIT_KEYS
            },
            'evidence': self._coerce_evidence(profile.get('evidence', [])),
            'choices_analyzed': int(profile.get('choices_analyzed', 0)),
            'cache_status': derived_cache_status,
            'analyzed_at': profile.get('updated_at') or profile.get('created_at') or datetime.now().isoformat(),
        }

    def _coerce_evidence(self, evidence: Any) -> List[Dict[str, str]]:
        """Coerce persisted evidence into the public API shape."""
        if not isinstance(evidence, list):
            return []
        normalized: List[Dict[str, str]] = []
        for item in evidence[:3]:
            if not isinstance(item, dict):
                continue
            choice = str(item.get('choice', '')).strip()
            signal = str(item.get('signal', '')).strip()
            trait = str(item.get('trait', '')).strip().lower()
            if not choice or not signal or trait not in TRAIT_KEYS:
                continue
            normalized.append({'choice': choice, 'signal': signal, 'trait': trait})
        return normalized

    def _normalize_score(self, value: Any) -> int:
        """Normalize trait scores into integer percentages."""
        try:
            score = int(round(float(value)))
        except (TypeError, ValueError):
            return 50
        return max(0, min(score, 100))

    def _derive_archetype(self, scores: Dict[str, int]) -> str:
        """Derive an archetype when the AI omits one."""
        top_trait = max(scores.items(), key=lambda item: item[1])[0]
        mapping = {
            'bravery': 'The Bold Strategist',
            'empathy': 'The Compassionate Diplomat',
            'cunning': 'The Cunning Pathfinder',
            'honor': 'The Honorable Guardian',
            'curiosity': 'The Curious Seeker',
            'caution': 'The Careful Tactician',
        }
        return mapping.get(top_trait, 'The Adaptive Adventurer')

    def _build_fallback_summary(self, game_state: GameState, scores: Dict[str, int]) -> str:
        """Build a deterministic fallback summary."""
        top_two = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:2]
        top_traits = ' and '.join(trait for trait, _ in top_two)
        return (
            f"Across {len(game_state.choices_history)} major decisions, this player most often showed "
            f"{top_traits}. Their choices suggest a flexible decision-making style that balances story momentum "
            "with awareness of consequences, creating a personality profile shaped by repeated patterns rather "
            "than any single moment."
        )

    def _is_processing_for_current_history(self, cached: Optional[Dict[str, Any]], history_fingerprint: str) -> bool:
        """Return whether the session already has an active analysis for this history."""
        if not cached or cached.get('status') != 'processing':
            return False
        if cached.get('history_fingerprint') != history_fingerprint:
            return False

        updated_at = cached.get('updated_at')
        if not updated_at:
            return False

        try:
            updated = datetime.fromisoformat(updated_at)
        except ValueError:
            return False

        return datetime.now() - updated < timedelta(seconds=PROCESSING_TTL_SECONDS)

    def _excerpt(self, text: str, limit: int) -> str:
        """Keep both ends of a long segment to preserve context."""
        if len(text) <= limit:
            return text
        head = max(limit // 2 - 2, 0)
        tail = max(limit - head - 3, 0)
        return f"{text[:head]}...{text[-tail:]}" if tail > 0 else text[:limit]

    def _get_mock_analysis(self, game_state: GameState) -> Dict[str, Any]:
        """Provide deterministic analysis when no API key is configured."""
        history_size = len(game_state.choices_history)
        return {
            'archetype': 'The Adaptive Adventurer' if history_size < 3 else 'The Bold Strategist',
            'summary': (
                f"Based on {history_size} recorded decisions, this player tends to push the story forward while "
                "still paying attention to the emotional and tactical consequences of each choice."
            ),
            'trait_scores': {
                'bravery': 74,
                'empathy': 63,
                'cunning': 68,
                'honor': 57,
                'curiosity': 71,
                'caution': 46,
            },
            'evidence': [
                {
                    'choice': entry.get('choice', '')[:220],
                    'signal': 'This choice advanced the narrative decisively.',
                    'trait': 'bravery' if idx == 0 else 'curiosity',
                }
                for idx, entry in enumerate(game_state.choices_history[-min(3, history_size):])
            ],
        }


personality_service = PersonalityService()
