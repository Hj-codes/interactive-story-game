import torch
from TTS.api import TTS

# Get device
device = "cuda" if torch.cuda.is_available() else "cpu"

# List available 🐸TTS models
print(TTS().list_models())

# Initialize TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

# List speakers
print(tts.speakers)

# Run TTS
# ❗ XTTS supports both, but many models allow only one of the `speaker` and
# `speaker_wav` arguments

# # TTS with list of amplitude values as output, clone the voice from `speaker_wav`
# wav = tts.tts(
#   text="John’s fingers close around the hilt of the fiery blade, and immediately, warmth surges up his arm, the blade's fierce energy pulsing like a heartbeat in his grasp. The blade crackles softly, tiny tongues of flame licking its edge, casting flickering shadows that dance on the ancient trees around him.",
#   speaker_wav="input.wav",
#   language="en"
# )

# TTS to a file, use a preset speaker
tts.tts_to_file(
  text="John’s fingers close around the hilt of the fiery blade, and immediately, warmth surges up his arm, the blade's fierce energy pulsing like a heartbeat in his grasp. The blade crackles softly, tiny tongues of flame licking its edge, casting flickering shadows that dance on the ancient trees around him.",
  speaker_wav="input.wav",
  language="en",
  file_path="output.wav"
)