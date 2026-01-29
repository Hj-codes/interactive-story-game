"""Deepgram Aura-2 TTS Service using the Orpheus voice.

This service provides text-to-speech synthesis using Deepgram's Aura-2 API
with the Orpheus voice for storytelling narration.

References:
- https://developers.deepgram.com/docs/text-to-speech
- Model: aura-2-orpheus-en
"""

import hashlib
import os
import threading
from typing import Optional, Tuple

import requests


class DeepgramTTSSynthesizer:
    """TTS synthesizer using Deepgram Aura-2 API with caching."""

    _instance_lock = threading.Lock()

    def __init__(self, cache_dir: Optional[str] = None, api_key: Optional[str] = None):
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), "..", "tts_cache")
        self.cache_dir = os.path.abspath(self.cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)
        
        self._api_key = api_key or os.environ.get("DEEPGRAM_API_KEY")
        if not self._api_key:
            raise ValueError("DEEPGRAM_API_KEY environment variable is required")
        
        # Deepgram API configuration
        self._base_url = "https://api.deepgram.com/v1/speak"
        self._model = "aura-2-orpheus-en"  # Aura-2 with Orpheus voice

    def _hash_key(self, text: str, model: Optional[str] = None) -> str:
        """Generate a cache key based on text and model."""
        h = hashlib.sha256()
        h.update(text.encode("utf-8"))
        h.update((model or self._model).encode("utf-8"))
        return h.hexdigest()

    def synthesize(
        self,
        *,
        text: str,
        model: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Synthesize text to an audio MP3 file using Deepgram Aura-2.

        Args:
            text: Text to synthesize (required, max 2000 characters).
            model: Model name. Defaults to "aura-2-orpheus-en".

        Returns:
            Tuple of (absolute_file_path, mime_type).
        """
        if not text or not text.strip():
            raise ValueError("Text is required for TTS")

        text = text.strip()
        
        # Deepgram has a 2000 character limit
        if len(text) > 2000:
            text = text[:2000]

        resolved_model = model or self._model
        cache_key = self._hash_key(text, resolved_model)
        out_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")

        # Return cached file if exists
        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            return out_path, "audio/mpeg"

        # Generate fresh audio via Deepgram API
        tmp_path = out_path + ".tmp"
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

        url = f"{self._base_url}?model={resolved_model}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Token {self._api_key}",
        }
        payload = {"text": text}

        response = requests.post(url, headers=headers, json=payload, stream=True)
        
        if response.status_code != 200:
            error_msg = response.text
            raise RuntimeError(f"Deepgram TTS failed with status {response.status_code}: {error_msg}")

        # Write audio to file
        with open(tmp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        # Atomic move into place
        os.replace(tmp_path, out_path)
        return out_path, "audio/mpeg"


# Singleton instance
deepgram_tts_synth = DeepgramTTSSynthesizer()
