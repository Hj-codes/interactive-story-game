import hashlib
import os
import threading
from typing import Optional, Tuple

import numpy as np


class _LazyTTS:
    _instance_lock = threading.Lock()
    _initialized = False

    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id or os.environ.get(
            "TTS_MODEL_ID",
            # A widely available English single-speaker model for reliability
            "tts_models/en/ljspeech/tacotron2-DDC",
        )
        self._tts = None
        self._device = None

    def _ensure_loaded(self):
        if self._initialized:
            return
        with self._instance_lock:
            if self._initialized:
                return
            # Import heavy deps lazily to keep app startup fast
            import torch  # type: ignore
            from TTS.api import TTS  # type: ignore

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._tts = TTS(self.model_id).to(self._device)
            self._initialized = True

    def synth_to_file(self, *, text: str, file_path: str, language: Optional[str] = None, speaker_wav: Optional[str] = None, speaker: Optional[str] = None) -> str:
        self._ensure_loaded()

        synth_kwargs = {
            "text": text,
            "file_path": file_path,
        }

        # Attempt most-capable call first
        if language:
            synth_kwargs["language"] = language
        if speaker_wav and os.path.exists(speaker_wav):
            synth_kwargs["speaker_wav"] = speaker_wav
        elif speaker:
            synth_kwargs["speaker"] = speaker

        try:
            self._tts.tts_to_file(**synth_kwargs)
        except TypeError:
            # Retry without speaker/language if model doesn't accept them
            fallback_kwargs = {"text": text, "file_path": file_path}
            try:
                self._tts.tts_to_file(**fallback_kwargs)
            except Exception:
                # Last resort: raise original error
                raise
        return file_path


class TTSSynthesizer:
    def __init__(self, cache_dir: Optional[str] = None, model_id: Optional[str] = None):
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), "..", "tts_cache")
        self.cache_dir = os.path.abspath(self.cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)
        self._tts = _LazyTTS(model_id)

    def _hash_key(self, text: str, language: Optional[str], speaker_wav: Optional[str], speaker: Optional[str]) -> str:
        h = hashlib.sha256()
        h.update(text.encode("utf-8"))
        h.update((language or "").encode("utf-8"))
        h.update((speaker or "").encode("utf-8"))
        # Only the basename of speaker_wav is relevant for cache key stability
        h.update((os.path.basename(speaker_wav) if speaker_wav else "").encode("utf-8"))
        return h.hexdigest()

    def synthesize(self, *, text: str, language: Optional[str] = None, speaker_wav: Optional[str] = None, speaker: Optional[str] = None) -> Tuple[str, str]:
        """
        Synthesize text to an audio WAV file, using on-disk caching.

        Returns: (absolute_file_path, mime_type)
        """
        if not text or not text.strip():
            raise ValueError("Text is required for TTS")

        cache_key = self._hash_key(text.strip(), language, speaker_wav, speaker)
        out_path = os.path.join(self.cache_dir, f"{cache_key}.wav")

        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            return out_path, "audio/wav"

        # Generate fresh audio
        tmp_path = out_path + ".tmp"
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

        self._tts.synth_to_file(text=text.strip(), file_path=tmp_path, language=language, speaker_wav=speaker_wav, speaker=speaker)

        # Atomic move into place
        os.replace(tmp_path, out_path)
        return out_path, "audio/wav"


# Singleton instance
tts_synth = TTSSynthesizer()


