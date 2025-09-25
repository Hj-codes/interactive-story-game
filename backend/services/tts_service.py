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
            # XTTS v2 supports speaker_wav voice cloning and English
            "tts_models/multilingual/multi-dataset/xtts_v2",
        )
        self._tts = None
        self._device = None
        self._speaker_profiles: dict[str, str] = {}

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
            print("Device: " + self._device)
            self._tts = TTS(self.model_id).to(self._device)
            # Auto-register default speaker profile from backend/input.wav if exists
            default_wav = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "input.wav"))
            if os.path.exists(default_wav):
                self.register_speaker_profile("default", default_wav)
            self._initialized = True

    def register_speaker_profile(self, name: str, wav_path: str) -> None:
        if not os.path.exists(wav_path):
            raise FileNotFoundError(f"Speaker WAV not found: {wav_path}")
        self._speaker_profiles[name] = os.path.abspath(wav_path)

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
            # Retry without language
            try:
                synth_kwargs.pop("language", None)
                self._tts.tts_to_file(**synth_kwargs)
            except TypeError:
                # Retry without speaker and language
                fallback_kwargs = {"text": text, "file_path": file_path}
                self._tts.tts_to_file(**fallback_kwargs)
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
        # Incorporate speaker WAV file content hash for correctness
        if speaker_wav and os.path.exists(speaker_wav):
            try:
                with open(speaker_wav, "rb") as f:
                    h.update(hashlib.sha256(f.read()).digest())
            except Exception:
                h.update((os.path.basename(speaker_wav) or "").encode("utf-8"))
        else:
            h.update(b"")
        return h.hexdigest()

    def synthesize(self, *, text: str, language: Optional[str] = None, speaker_wav: Optional[str] = None, speaker: Optional[str] = None, speaker_profile: Optional[str] = None) -> Tuple[str, str]:
        """
        Synthesize text to an audio WAV file, using on-disk caching.

        Returns: (absolute_file_path, mime_type)
        """
        if not text or not text.strip():
            raise ValueError("Text is required for TTS")

        # Ensure model is loaded so default profiles are registered
        try:
            self._tts._ensure_loaded()
        except Exception:
            # If ensure_loaded fails here, _LazyTTS will run it during synth as well
            pass

        # Resolve speaker from profile or default auto-registered profile
        resolved_speaker_wav = speaker_wav
        profiles = getattr(self._tts, "_speaker_profiles", {})
        if not resolved_speaker_wav and speaker_profile and speaker_profile in profiles:
            resolved_speaker_wav = profiles[speaker_profile]
        if not resolved_speaker_wav and "default" in profiles:
            resolved_speaker_wav = profiles["default"]

        cache_key = self._hash_key(text.strip(), language, resolved_speaker_wav, speaker)
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

        self._tts.synth_to_file(text=text.strip(), file_path=tmp_path, language=language, speaker_wav=resolved_speaker_wav, speaker=speaker)

        # Atomic move into place
        os.replace(tmp_path, out_path)
        return out_path, "audio/wav"


# Singleton instance
tts_synth = TTSSynthesizer()


