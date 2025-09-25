import os
from flask import Blueprint, request, jsonify, send_file, make_response
from services.tts_service import tts_synth


narrate_bp = Blueprint('narrate', __name__)


@narrate_bp.route('/narrate', methods=['POST'])
def narrate():
    """Generate narration audio for provided story text.

    Request JSON body:
      - text: string (required)
      - language: string (optional, e.g., 'en')
      - speaker: string (optional, model-specific)
      - speaker_wav: string (optional, path to reference voice on server)

    Response: audio file (audio/wav) with caching.
    """
    try:
        data = request.get_json(silent=True) or {}

        text = (data.get('text') or '').strip()
        if not text:
            return jsonify({
                'success': False,
                'error': 'text is required'
            }), 400

        # Force English-only usage for non-multilingual default model
        language = None
        speaker = data.get('speaker')
        speaker_wav = data.get('speaker_wav')

        # Synthesize (with on-disk caching inside synthesizer)
        audio_path, mime = tts_synth.synthesize(
            text=text,
            language=language,
            speaker_wav=speaker_wav,
            speaker=speaker,
        )

        # Serve the generated file; allow browsers to start playback ASAP
        resp = make_response(send_file(
            audio_path,
            mimetype=mime,
            as_attachment=False,
            conditional=True,
            max_age=3600,
        ))
        resp.headers['Cache-Control'] = 'public, max-age=3600'
        return resp

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'TTS synthesis failed: {str(e)}'
        }), 500


