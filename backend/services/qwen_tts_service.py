"""Qwen3 TTS Service using Qwen3-TTS-12Hz-0.6B-CustomVoice model.

This service provides text-to-speech synthesis using the Qwen3 TTS model
with support for the "Uncle Fu" preset voice for storytelling narration.

References:
- https://github.com/QwenLM/Qwen3-TTS
- Model: Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
"""

import hashlib
import os
import threading
from typing import Optional, Tuple

import numpy as np


class _LazyQwenTTS:
    """Lazy-loading wrapper for Qwen3 TTS model to keep app startup fast."""

    _instance_lock = threading.Lock()
    _initialized = False

    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id or os.environ.get(
            "QWEN_TTS_MODEL_ID",
            "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
        )
        self._model = None
        self._device = None
        self._default_speaker = os.environ.get("QWEN_TTS_DEFAULT_SPEAKER", "uncle_fu")

    def _ensure_loaded(self):
        if self._initialized:
            return
        with self._instance_lock:
            if self._initialized:
                return

            import torch
            from qwen_tts import Qwen3TTSModel

            self._device = "cuda:0" if torch.cuda.is_available() else "cpu"
            print(f"[Qwen3 TTS] Loading model {self.model_id} on {self._device}...")

            # Determine attention implementation
            attn_impl = "flash_attention_2" if torch.cuda.is_available() else "eager"
            dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

            try:
                self._model = Qwen3TTSModel.from_pretrained(
                    self.model_id,
                    device_map=self._device,
                    dtype=dtype,
                    attn_implementation=attn_impl,
                )
            except Exception as e:
                # Fallback without flash attention
                print(f"[Qwen3 TTS] Flash attention failed, using eager: {e}")
                self._model = Qwen3TTSModel.from_pretrained(
                    self.model_id,
                    device_map=self._device,
                    dtype=dtype,
                    attn_implementation="eager",
                )

            print(f"[Qwen3 TTS] Model loaded successfully.")
            self._initialized = True

    def get_supported_speakers(self) -> list[str]:
        """Return list of supported speaker names."""
        self._ensure_loaded()
        try:
            return self._model.get_supported_speakers()
        except Exception:
            # Fallback known speakers for 0.6B CustomVoice model
            return ["uncle_fu", "vivian", "ryan", "auntie_li"]

    def get_supported_languages(self) -> list[str]:
        """Return list of supported languages."""
        self._ensure_loaded()
        try:
            return self._model.get_supported_languages()
        except Exception:
            return ["Chinese", "English", "Japanese", "Korean", "German", "French", "Russian", "Portuguese", "Spanish", "Italian"]

    def synth_to_file(
        self,
        *,
        text: str,
        file_path: str,
        language: Optional[str] = None,
        speaker: Optional[str] = None,
        instruct: Optional[str] = None,
    ) -> str:
        """Synthesize text to a WAV file using Qwen3 TTS.

        Args:
            text: The text to synthesize.
            file_path: Output file path for the WAV file.
            language: Language (e.g., "English", "Chinese"). Defaults to "Auto".
            speaker: Speaker name (e.g., "Uncle Fu"). Defaults to configured default.
            instruct: Optional instruction for tone/emotion (e.g., "用温暖的语气说").

        Returns:
            The file_path where audio was saved.
        """
        self._ensure_loaded()
        import soundfile as sf

        resolved_speaker = speaker or self._default_speaker
        resolved_language = language or "Auto"

        generate_kwargs = {
            "text": text,
            "language": resolved_language,
            "speaker": resolved_speaker,
        }
        if instruct:
            generate_kwargs["instruct"] = instruct

        wavs, sr = self._model.generate_custom_voice(**generate_kwargs)

        # Write the first (or only) waveform to file
        sf.write(file_path, wavs[0], sr, format='WAV')
        return file_path


class QwenTTSSynthesizer:
    """High-level TTS synthesizer with caching for Qwen3 TTS."""

    def __init__(self, cache_dir: Optional[str] = None, model_id: Optional[str] = None):
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), "..", "tts_cache")
        self.cache_dir = os.path.abspath(self.cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)
        self._tts = _LazyQwenTTS(model_id)

    def _hash_key(
        self,
        text: str,
        language: Optional[str],
        speaker: Optional[str],
        instruct: Optional[str],
    ) -> str:
        h = hashlib.sha256()
        h.update(text.encode("utf-8"))
        h.update((language or "").encode("utf-8"))
        h.update((speaker or "").encode("utf-8"))
        h.update((instruct or "").encode("utf-8"))
        return h.hexdigest()

    def synthesize(
        self,
        *,
        text: str,
        language: Optional[str] = None,
        speaker: Optional[str] = None,
        instruct: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Synthesize text to an audio WAV file, using on-disk caching.

        Args:
            text: Text to synthesize (required).
            language: Language code (e.g., "English"). Defaults to auto-detect.
            speaker: Speaker name. Defaults to "Uncle Fu".
            instruct: Optional emotion/tone instruction.

        Returns:
            Tuple of (absolute_file_path, mime_type).
        """
        if not text or not text.strip():
            raise ValueError("Text is required for TTS")

        cache_key = self._hash_key(text.strip(), language, speaker, instruct)
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

        self._tts.synth_to_file(
            text=text.strip(),
            file_path=tmp_path,
            language=language,
            speaker=speaker,
            instruct=instruct,
        )

        # Atomic move into place
        os.replace(tmp_path, out_path)
        return out_path, "audio/wav"

    def get_supported_speakers(self) -> list[str]:
        """Return list of supported speakers."""
        return self._tts.get_supported_speakers()

    def get_supported_languages(self) -> list[str]:
        """Return list of supported languages."""
        return self._tts.get_supported_languages()


# Singleton instance using Qwen3 TTS with Uncle Fu as default
qwen_tts_synth = QwenTTSSynthesizer()
