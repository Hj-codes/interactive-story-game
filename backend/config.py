import os
from dotenv import load_dotenv

load_dotenv()

PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
DATABASE_PATH = os.getenv('DATABASE_PATH', './database.sqlite')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
QWEN_TTS_DEFAULT_SPEAKER = os.getenv('QWEN_TTS_DEFAULT_SPEAKER', 'uncle_fu')

# AI Configuration
PERPLEXITY_BASE_URL = "https://api.perplexity.ai/chat/completions"
MAX_CONTEXT_LENGTH = 1000
STORY_LENGTH_WORDS = 200

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN = os.getenv('WORKER_AI_API')
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACC_ID')

# Deepgram Configuration
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
