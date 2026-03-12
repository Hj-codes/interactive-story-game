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
PERPLEXITY_MODEL = os.getenv('PERPLEXITY_MODEL', 'sonar')
MAX_CONTEXT_LENGTH = 1000
STORY_LENGTH_WORDS = 200
PERSONALITY_ANALYSIS_MODEL = os.getenv('PERSONALITY_ANALYSIS_MODEL', 'sonar')
PERSONALITY_ANALYSIS_MAX_INPUT_CHARS = int(os.getenv('PERSONALITY_ANALYSIS_MAX_INPUT_CHARS', '12000'))
PERSONALITY_ANALYSIS_VERSION = int(os.getenv('PERSONALITY_ANALYSIS_VERSION', '1'))

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN = os.getenv('WORKER_AI_API')
CLOUDFLARE_ACCOUNT_ID = os.getenv('CLOUDFLARE_ACC_ID')

# Deepgram Configuration
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
