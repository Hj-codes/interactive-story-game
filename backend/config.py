import os
from dotenv import load_dotenv

load_dotenv()

PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
DATABASE_PATH = os.getenv('DATABASE_PATH', './database.sqlite')
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

# AI Configuration
PERPLEXITY_BASE_URL = "https://api.perplexity.ai/chat/completions"
MAX_CONTEXT_LENGTH = 1000
STORY_LENGTH_WORDS = 200
