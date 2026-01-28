import os
from flask import Blueprint, request, jsonify, send_file, make_response
from services.qwen_tts_service import qwen_tts_synth


narrate_bp = Blueprint('narrate', __name__)


@narrate_bp.route('/narrate', methods=['POST'])
def narrate():
    """Generate narration audio for provided story text using Qwen3 TTS.

    Request JSON body:
      - text: string (required)
      - language: string (optional, e.g., 'English', 'Chinese')
      - speaker: string (optional, default: 'Uncle Fu')
      - instruct: string (optional, emotion/tone instruction)

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

        # Default to English for storytelling; Qwen3 supports auto-detection too
        language = data.get('language') or 'English'
        speaker = data.get('speaker') or 'uncle_fu'
        
        # Default storyteller tone: relaxed, narrative voice
        default_instruct = "Speak in a relaxed, warm storyteller tone. Use a calm and engaging narrative voice, as if telling a captivating story by a fireside."
        instruct = data.get('instruct') or default_instruct

        # Synthesize (with on-disk caching inside synthesizer)
        audio_path, mime = qwen_tts_synth.synthesize(
            text=text,
            language=language,
            speaker=speaker,
            instruct=instruct,
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


