import os
from flask import Blueprint, request, jsonify, send_file, make_response
from services.deepgram_tts_service import deepgram_tts_synth


narrate_bp = Blueprint('narrate', __name__)


@narrate_bp.route('/narrate', methods=['POST'])
def narrate():
    """Generate narration audio for provided story text using Deepgram Aura-2.

    Request JSON body:
      - text: string (required, max 2000 characters)

    Response: audio file (audio/mpeg) with caching.
    """
    try:
        data = request.get_json(silent=True) or {}

        text = (data.get('text') or '').strip()
        if not text:
            return jsonify({
                'success': False,
                'error': 'text is required'
            }), 400

        # Synthesize using Deepgram Aura-2 with Orpheus voice (with on-disk caching)
        audio_path, mime = deepgram_tts_synth.synthesize(text=text)

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
