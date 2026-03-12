# Interactive Story Game: Detailed Feature Report

## Executive Summary

This report provides a comprehensive technical analysis of the Interactive Story Game application, an AI-driven narrative system that generates dynamic, branching storylines in real-time. The system integrates multiple artificial intelligence technologies including Large Language Models (LLMs), neural text-to-speech synthesis, image generation, and player personality inference to create an immersive, personalized storytelling experience.

---

## 1. Project Overview

### 1.1 Problem Statement

Traditional interactive fiction and branching narrative games face significant scalability challenges. Manual authoring of branching storylines requires exponential writing effort as narrative depth increases, leading to either shallow stories with limited choices or inconsistent narrative quality across branches. Furthermore, static scripts cannot adapt to individual player preferences, resulting in replay experiences that feel identical regardless of player decisions.

### 1.2 Solution Approach

The Interactive Story Game addresses these limitations through an AI-assisted architecture that:

- **Generates coherent narrative segments dynamically** based on player choices, maintaining approximately 200-word story continuations that end in decision points
- **Presents exactly three distinct choices** at each narrative junction, ensuring manageable cognitive load while offering meaningful agency
- **Maintains rolling context** of up to 1,000 characters to preserve narrative coherence without overwhelming the AI with excessive history
- **Provides integrated narration** through multiple text-to-speech engines for accessibility and immersion
- **Infers player personality** from choice patterns to create personalized profile summaries
- **Generates contextual imagery** to visually represent the current story scene

### 1.3 Core Architecture

The system follows a modern client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐          ┌─────────────────────────────────────┐  │
│  │   FRONTEND (React)  │◄────────►│         BACKEND (Flask)             │  │
│  │   - Vite + TS       │   REST   │   - Python 3.11-3.13                │  │
│  │   - Tailwind CSS    │          │   - SQLite Persistence              │  │
│  │   - Framer Motion   │          │                                     │  │
│  └─────────────────────┘          │  ┌─────────────────────────────┐   │  │
│                                    │  │      AI SERVICE LAYER       │   │  │
│                                    │  │  ┌─────────────────────┐    │   │  │
│                                    │  │  │ Story Generation    │────┼───┼──┼──┼──► Perplexity AI (sonar)
│                                    │  │  └─────────────────────┘    │   │  │
│                                    │  │  ┌─────────────────────┐    │   │  │
│                                    │  │  │ Personality Analysis│────┼───┼──┼──┼──► Perplexity AI (sonar)
│                                    │  │  └─────────────────────┘    │   │  │
│                                    │  │  ┌─────────────────────┐    │   │  │
│                                    │  │  │ Image Generation    │────┼───┼──┼──┼──► Cloudflare FLUX.1
│                                    │  │  └─────────────────────┘    │   │  │
│                                    │  └─────────────────────────────┘   │  │
│                                    │                                     │  │
│                                    │  ┌─────────────────────────────┐   │  │
│                                    │  │      TTS SERVICE LAYER      │   │  │
│                                    │  │  ┌─────────────────────┐    │   │  │
│                                    │  │  │ XTTS v2 (Coqui)     │────┼───┼──┘
│                                    │  │  └─────────────────────┘    │   │
│                                    │  │  ┌─────────────────────┐    │   │
│                                    │  │  │ Qwen3 TTS           │────┼───┘
│                                    │  │  └─────────────────────┘    │   │
│                                    │  │  ┌─────────────────────┐    │   │
│                                    │  │  │ Deepgram Aura-2     │────┼───► External API
│                                    │  │  └─────────────────────┘    │   │
│                                    │  └─────────────────────────────┘   │
│                                    └─────────────────────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Main Workflow

The application follows a turn-based gameplay loop:

1. **Session Initialization**: Player starts a new game or loads a saved session. The backend creates a `game_sessions` database record with initial story context and three starting choices.

2. **Story Display**: The frontend presents the current story segment (~200 words), displays three choice buttons, shows character information, and renders any generated imagery.

3. **Player Choice**: Player selects one of three options. The choice is sent via POST to `/api/game/choice` with the session ID.

4. **AI Generation**: The backend constructs a structured prompt containing the rolling context, player's choice, and character information. This is sent to the Perplexity AI API with explicit constraints (word count, choice count, tone).

5. **Response Processing**: The AI returns a JSON object with the story continuation, three new choices, and an image prompt. The system validates and normalizes this response, applying fallbacks if the format deviates.

6. **State Update**: The game state is updated with the new story segment, choices are stored in history, and the session is persisted to SQLite.

7. **Optional Narration**: Player can trigger text-to-speech synthesis. The TTS service checks the disk cache first; if not present, it generates audio using one of the available engines.

8. **Personality Analysis**: After sufficient choices (minimum one), the system can analyze the player's decision patterns to infer personality traits and generate an archetype profile.

---

## 2. Large Language Models (LLMs) Used

### 2.1 Primary Story Generation Model: Perplexity Sonar

The system leverages **Perplexity's Sonar model** as its primary narrative generation engine. Perplexity AI provides an API-compatible interface with OpenAI's chat completions format, allowing seamless integration.

**Configuration:**
- **Model ID**: `sonar` (configurable via `PERPLEXITY_MODEL` environment variable)
- **API Endpoint**: `https://api.perplexity.ai/chat/completions`
- **Authentication**: Bearer token via `PERPLEXITY_API_KEY`
- **Timeout**: 30 seconds per request

**Role in the System:**

The Sonar model serves as the creative engine responsible for:

1. **Story Continuation Generation**: When a player makes a choice, the model receives a structured prompt containing the rolling story context (truncated to 1,000 characters), the player's selected choice, character information, and explicit formatting rules. It generates approximately 200 words of narrative prose that maintains consistency with previous events while advancing the plot.

2. **Choice Generation**: The model produces exactly three distinct choice options at the end of each story segment. These choices must be meaningful, distinct, and lead to different narrative paths. The system enforces this constraint through prompt engineering and post-processing validation.

3. **Image Prompt Generation**: Alongside story text and choices, the model generates a concise, vivid image prompt that captures the mood, setting, and key visual elements of the current scene. This prompt is passed to the image generation service.

**Prompt Engineering Strategy:**

The system employs a carefully crafted prompt template that enforces structural constraints:

```
You are an interactive fiction storyteller. Continue this story based on the player's choice.

STORY CONTEXT: {context}
PLAYER'S CHOICE: {player_choice}

Rules:
- Write approximately {word_goal} words continuing the story (±50)
- End with a situation requiring a decision
- Provide exactly 3 distinct choices
- Maintain consistency with previous events
- Keep it engaging and family-friendly
- Use vivid descriptions and compelling narrative
- Create meaningful consequences for player choices
- Include character development opportunities
- Generate a concise image prompt that visually captures the current scene's mood and setting

Format response as JSON: {...}
```

### 2.2 Personality Analysis Model

The same **Perplexity Sonar model** (or a configurable alternative via `PERSONALITY_ANALYSIS_MODEL`) is used for player personality inference.

**Role in the System:**

1. **Decision Pattern Analysis**: After the player has made one or more choices, the system can request a personality analysis. The model receives the complete choice history (with recent entries emphasized), character information, and instructions to score six personality traits.

2. **Trait Scoring**: The model assigns integer scores (0-100) for:
   - **Bravery**: Willingness to take risks and confront challenges
   - **Empathy**: Consideration for others' feelings and well-being
   - **Cunning**: Strategic thinking and clever problem-solving
   - **Honor**: Commitment to principles and moral codes
   - **Curiosity**: Drive to explore and discover new information
   - **Caution**: Preference for careful, deliberate action

3. **Archetype Derivation**: Based on trait scores, the model assigns a narrative archetype title (e.g., "The Bold Strategist", "The Compassionate Diplomat") and generates a 120-220 word summary explaining the player's decision-making style.

4. **Evidence Extraction**: The model provides 2-3 pieces of evidence linking specific choices to dominant personality traits, explaining why certain decisions indicate particular characteristics.

**Prompt Structure:**

```
Analyze this interactive-story session and infer the player's decision-making style.

Character: {character_info}
History metadata: {total_choices}
Choice history: {formatted_history}

Score these traits from 0 to 100: bravery, empathy, cunning, honor, curiosity, caution

Return JSON with archetype, summary, trait_scores, and evidence array.
```

### 2.3 Response Parsing and Resilience

The system implements a multi-layered parsing strategy to handle imperfect AI responses:

1. **Direct JSON Parsing**: Attempts to parse the response as valid JSON
2. **Markdown Code Block Extraction**: Looks for JSON within triple backtick code blocks
3. **Curly Brace Extraction**: Searches for JSON-like content within curly braces
4. **Fallback Extraction**: Uses regex patterns to extract story text and numbered/lettered choices from unstructured content
5. **Mock Responses**: Provides deterministic fallback content when no API key is configured, enabling offline development

This resilience layer ensures the game remains playable even when the AI service returns malformed responses or is temporarily unavailable.

---

## 3. Voice Models and Text-to-Speech Systems

The application implements a multi-provider TTS architecture with three distinct synthesis engines, allowing flexibility in voice characteristics and deployment scenarios.

### 3.1 Coqui TTS (XTTS v2)

**Model**: `tts_models/multilingual/multi-dataset/xtts_v2`

**Purpose**: Primary on-device TTS with voice cloning capabilities

**Technical Specifications:**
- **Architecture**: Neural text-to-speech based on Tacotron 2 and WaveRNN principles
- **Capabilities**: Multilingual synthesis (English, Spanish, French, German, Italian, Portuguese, Polish, Turkish, Russian, Dutch, Czech, Arabic, Chinese, Japanese, Korean, Hungarian, Hindi)
- **Voice Cloning**: Supports speaker adaptation via reference WAV files (voice cloning)
- **Hardware Acceleration**: Automatic CUDA detection; falls back to CPU if GPU unavailable
- **Lazy Loading**: Model is loaded only when first TTS request is made to minimize application startup time

**Integration in Pipeline:**

1. **Caching Strategy**: The `TTSSynthesizer` class computes a SHA-256 hash of the input text, language, speaker identity, and speaker WAV file content. This hash serves as the cache key for on-disk storage in the `tts_cache/` directory.

2. **Speaker Profiles**: The system supports named speaker profiles. A default speaker profile can be auto-registered from `backend/input.wav` at startup.

3. **Synthesis Flow**:
   ```
   Request Text → Check Cache → [Cache Miss] → Load XTTS v2 → Synthesize → Store WAV → Return Path
   ```

4. **Fallback Handling**: The synthesis method attempts multiple calling conventions (with language and speaker, without language, without speaker) to accommodate different model configurations.

**Role in System**: Provides high-quality, customizable narration with the option for voice cloning, making it suitable for personalized storytelling where a consistent narrator voice enhances immersion.

### 3.2 Qwen3 TTS (Qwen3-TTS-12Hz-0.6B-CustomVoice)

**Model**: `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice`

**Purpose**: Alternative TTS with preset character voices optimized for storytelling

**Technical Specifications:**
- **Architecture**: Transformer-based TTS with 0.6B parameters
- **Frequency**: 12kHz sampling rate
- **Custom Voice Support**: Includes preset speaker personas designed for narrative content
- **Default Speaker**: "Uncle Fu" (a warm, storytelling-optimized voice)
- **Additional Presets**: "vivian", "ryan", "auntie_li"
- **Language Support**: Auto-detection with support for Chinese, English, Japanese, Korean, German, French, Russian, Portuguese, Spanish, Italian
- **Instruction Support**: Accepts emotion/tone instructions (e.g., "用温暖的语气说" for warm tone)

**Integration in Pipeline:**

1. **Model Loading**: Uses lazy initialization with Flash Attention 2 on CUDA for efficiency; falls back to eager attention if Flash Attention fails.

2. **Caching Strategy**: Similar hash-based caching to XTTS, but includes the optional instruction parameter in the cache key.

3. **Synthesis Flow**:
   ```
   Text + Language + Speaker + [Instruction] → Check Cache → Generate → Return WAV
   ```

**Role in System**: Offers a character-driven narration option where the "Uncle Fu" persona provides a distinct storytelling voice. The instruction feature allows dynamic emotional modulation based on story context (e.g., whispering for tense scenes, enthusiasm for exciting moments).

### 3.3 Deepgram Aura-2 (Orpheus)

**Model**: `aura-2-orpheus-en`

**Purpose**: Cloud-based TTS via API for scenarios where local model inference is impractical

**Technical Specifications:**
- **Provider**: Deepgram API (cloud service)
- **Model**: Aura-2 series with Orpheus voice optimized for English narration
- **Output Format**: MP3 (mpeg audio)
- **Character Limit**: 2,000 characters per request
- **Authentication**: API key via `DEEPGRAM_API_KEY` environment variable

**Integration in Pipeline:**

1. **API Communication**: Direct HTTP POST to `https://api.deepgram.com/v1/speak` with streaming response handling.

2. **Caching Strategy**: SHA-256 hash of text and model name serves as cache key. Unlike local TTS, this cache prevents redundant API calls and associated costs.

3. **Synthesis Flow**:
   ```
   Text (≤2000 chars) → Check Cache → [Cache Miss] → POST to Deepgram → Stream Response → Save MP3
   ```

**Role in System**: Provides a lightweight, maintenance-free TTS option that doesn't require GPU resources or model storage. Ideal for deployments where local inference is not feasible.

### 3.4 TTS Service Architecture Summary

| Feature | XTTS v2 | Qwen3 TTS | Deepgram Aura-2 |
|---------|---------|-----------|-----------------|
| **Deployment** | Local (GPU/CPU) | Local (GPU/CPU) | Cloud API |
| **Voice Cloning** | Yes (reference WAV) | Limited (presets) | No |
| **Languages** | 16+ | 10 (Auto-detect) | English |
| **Output Format** | WAV | WAV | MP3 |
| **Customization** | High | Medium (instructions) | Low |
| **Offline Use** | Yes | Yes | No |
| **Emotion Control** | Limited | High (instruction param) | Voice-dependent |

The frontend `NarrationPlayer` component interfaces with the `/api/narrate` endpoint, which can route to any of these backends based on configuration.

---

## 4. Image Models Used

### 4.1 Cloudflare Workers AI: FLUX.1 [schnell]

**Model**: `@cf/black-forest-labs/flux-1-schnell`

**Purpose**: Real-time image generation to visually represent story scenes

**Technical Specifications:**
- **Architecture**: Latent diffusion model optimized for speed
- **Provider**: Cloudflare Workers AI (via API)
- **Inference Steps**: 8 (maximum for schnell variant)
- **Output Format**: Base64-encoded PNG
- **API Endpoint**: `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell`

**Integration in Pipeline:**

1. **Prompt Generation**: The story generation LLM creates an image prompt as part of its JSON response. This prompt is designed to be "a vivid, artistic description of the scene for image generation, focusing on atmosphere and key visual elements."

2. **Generation Request**: When the frontend displays a new story segment, it may trigger an image generation request to `/api/story/generate-image` (or similar endpoint) with the AI-generated prompt.

3. **API Communication**: The `ImageGenerationService` sends the prompt to Cloudflare's FLUX.1 endpoint with 8 inference steps.

4. **Response Handling**: The base64 image data is extracted from the JSON response and can be embedded directly in the frontend or cached server-side.

5. **Fallback Behavior**: If Cloudflare credentials are not configured, the service gracefully skips image generation without crashing the application.

**Role in System**: Enhances immersion by providing visual context for narrative scenes. The speed-optimized FLUX.1 [schnell] variant ensures images can be generated during the natural gameplay flow without significant latency.

**Prompt Engineering for Image Generation:**

The LLM-generated prompts follow a specific style:
- Emphasize atmosphere and mood (e.g., "mystical twilight atmosphere")
- Include key visual elements (e.g., "glowing blue bioluminescent fungi")
- Specify art style (e.g., "fantasy digital art", "cinematic lighting")
- Describe character interactions with environment

---

## 5. Personality Prediction System

### 5.1 Methodology Overview

The personality prediction system analyzes player choice patterns to infer psychological traits and decision-making styles. Unlike traditional personality tests that ask explicit questions, this system infers characteristics from observed behavior within the narrative context.

### 5.2 Data Collection

**Source Data**: Every player choice is recorded in the `choices_history` array with the following structure:
```json
{
  "index": 1,
  "choice": "Approach the creature slowly with open hands",
  "story_segment_excerpt": "You venture into the shadowy forest...",
  "timestamp": "2026-03-12T10:30:00"
}
```

**History Fingerprinting**: To detect stale analyses, the system computes a fingerprint of the choice history (e.g., hash of choice texts and count). When new choices are made, the fingerprint changes, triggering re-analysis.

### 5.3 Trait Scoring Framework

The system uses a six-trait model inspired by RPG character attributes and Big Five personality theory adaptations:

1. **Bravery (0-100)**: Measures risk tolerance and willingness to confront danger. High scores indicate players who choose aggressive or confrontational options.

2. **Empathy (0-100)**: Measures consideration for others' well-being. High scores indicate players who prioritize helping NPCs, avoiding harm to others, or emotional connection.

3. **Cunning (0-100)**: Measures strategic and clever problem-solving. High scores indicate players who choose deceptive, clever, or indirect solutions.

4. **Honor (0-100)**: Measures commitment to principles and moral codes. High scores indicate players who choose truthful, noble, or duty-bound options.

5. **Curiosity (0-100)**: Measures drive to explore and discover. High scores indicate players who choose investigational, exploratory, or knowledge-seeking options.

6. **Caution (0-100)**: Measures preference for careful, deliberate action. High scores indicate players who choose safe, prepared, or risk-averse options.

### 5.4 Analysis Pipeline

**Step 1: History Formatting**
The `PersonalityService` formats the choice history into a structured payload:
- Recent entries (last 5) receive longer excerpt sizes (320 characters)
- Older entries receive shorter excerpts (180 characters)
- If total size exceeds `PERSONALITY_ANALYSIS_MAX_INPUT_CHARS` (12,000), the system applies progressive compression
- Final fallback preserves all choices with minimal excerpts (40 characters)

**Step 2: LLM Analysis**
The formatted history is sent to the AI with instructions to:
- Score all six traits (0-100, integers)
- Assign a narrative archetype title
- Generate a personality summary (120-220 words)
- Provide 2-3 evidence items linking specific choices to traits

**Step 3: Normalization**
The `PersonalityService` normalizes and validates the AI response:
- Scores are clamped to 0-100 range
- Missing archetypes are derived from the highest-scoring trait
- Missing summaries are generated from top two traits
- Invalid evidence items are filtered; if none remain, fallback evidence is created from recent choices

**Step 4: Caching and Persistence**
Results are stored in the SQLite database with:
- Session ID
- History fingerprint (for staleness detection)
- Analysis version (enabling future algorithm updates)
- Model name (for reproducibility)
- All trait scores, archetype, summary, and evidence

### 5.5 Archetype Derivation Logic

When the AI doesn't provide an archetype, or as a validation check, the system maps the highest-scoring trait to a default archetype:

| Top Trait | Archetype |
|-----------|-----------|
| Bravery | The Bold Strategist |
| Empathy | The Compassionate Diplomat |
| Cunning | The Cunning Pathfinder |
| Honor | The Honorable Guardian |
| Curiosity | The Curious Seeker |
| Caution | The Careful Tactician |
| (tie/no data) | The Adaptive Adventurer |

### 5.6 Usage in Application

The personality profile is displayed to the player via the `PersonalityRevealDialog` component, providing:
- **Archetype Title**: A narrative identity (e.g., "The Bold Strategist")
- **Trait Visualization**: Score bars or radar chart showing relative trait strengths
- **Summary Text**: A narrative explanation of the player's decision-making style
- **Evidence**: Specific choices that contributed to the analysis

This feature adds a meta-game element where players can reflect on their own decision patterns and potentially adjust their playstyle for different outcomes.

---

## 6. Additional System Features

### 6.1 State Management and Persistence

**Session Management**:
- Each game session receives a unique UUID (`session_id`)
- Session state includes: story context, current story text, choices history, character info, current choices, and timestamps
- Sessions persist in SQLite with automatic serialization/deserialization of JSON fields

**Save/Load System**:
- Players can save the current state with a custom name
- Saves store a complete snapshot of the `GameState` object
- Multiple saves per session are supported
- Load operation restores a snapshot as the current active session

**Rolling Context Management**:
The `GameState` class implements sentence-aware context trimming:
- Maximum context length: 1,000 characters (configurable)
- Trimming preserves sentence boundaries (avoids mid-sentence cuts)
- Context is built from choice history plus current segment, deduplicated
- This bounded context prevents token limit issues while maintaining narrative coherence

### 6.2 Database Architecture (SQLite)

**Tables**:

1. **game_sessions**:
   ```sql
   - id (TEXT PRIMARY KEY)
   - story_context (TEXT)
   - current_story (TEXT)
   - choices_history (TEXT, JSON)
   - character_info (TEXT, JSON)
   - current_choices (TEXT, JSON)
   - created_at, updated_at (TIMESTAMP)
   ```

2. **saved_games**:
   ```sql
   - id (TEXT PRIMARY KEY)
   - session_id (TEXT, FOREIGN KEY)
   - save_name (TEXT)
   - game_state (TEXT, JSON snapshot)
   - saved_at (TIMESTAMP)
   ```

3. **personality_profiles** (implied from service code):
   ```sql
   - session_id (TEXT PRIMARY KEY)
   - history_fingerprint (TEXT)
   - choices_analyzed (INTEGER)
   - analysis_version (INTEGER)
   - model_name (TEXT)
   - status (TEXT: 'completed', 'processing', 'failed')
   - archetype (TEXT)
   - summary (TEXT)
   - trait_scores (TEXT, JSON)
   - evidence (TEXT, JSON)
   - raw_response (TEXT)
   - last_error (TEXT)
   - created_at, updated_at (TIMESTAMP)
   ```

**Indexing**: Indexes on `session_id` and `saved_at` ensure efficient retrieval of saves and profiles.

### 6.3 API Layer

The Flask backend exposes RESTful endpoints organized by functionality:

**Game Endpoints** (`/api/game/*`):
- `POST /api/game/start` — Initialize new session with starting story and choices
- `POST /api/game/choice` — Process player choice, generate continuation
- `GET /api/game/state/:session_id` — Retrieve current session state
- `POST /api/game/save` — Persist current state as named save
- `POST /api/game/load/:save_id` — Restore save as active session
- `GET /api/game/saves` — List all saves (optionally filtered by session)
- `GET /api/game/personality/:session_id` — Retrieve cached personality profile
- `POST /api/game/personality/:session_id/analyze` — Trigger new personality analysis

**Story Endpoints** (`/api/story/*`):
- `POST /api/story/generate` — Generate continuation given context and choice
- `POST /api/story/generate-image` — Generate image from prompt

**Narration Endpoints** (`/api/narrate`):
- `POST /api/narrate` — Synthesize text to audio (routes to configured TTS engine)

### 6.4 Frontend Architecture

**Technology Stack**:
- **Framework**: React 18.3.1 with TypeScript 5.6.2
- **Build Tool**: Vite 5.4.8
- **Styling**: Tailwind CSS 3.4.14 with tailwindcss-animate
- **Animation**: Framer Motion 11.0.23
- **UI Components**: Radix UI primitives (Dialog, Label, Slider, Toast, etc.)
- **Icons**: Lucide React
- **Notifications**: Sonner toast library

**Key Components**:

1. **App.tsx**: Main application shell managing session lifecycle, keyboard shortcuts (1/2/3 for choices), and toast notifications

2. **StoryArea.tsx**: Displays the current story text with typography optimization for readability

3. **Choices.tsx**: Renders three choice buttons with hover animations and keyboard accessibility

4. **CharacterInfoCard.tsx**: Shows player character details (name, traits, inventory)

5. **HistoryPanel.tsx**: Collapsible sidebar showing chronological choice and story history

6. **NarrationPlayer.tsx**: Audio player controls for TTS playback with play/pause and progress indicators

7. **PersonalityRevealDialog.tsx**: Modal displaying personality analysis results with trait visualizations

8. **SaveDialog.tsx / LoadDialog.tsx**: Forms for saving and loading game states

**State Management**:
- React hooks (useState, useEffect) for local component state
- Session persistence to localStorage for auto-restore on refresh
- API client pattern with typed request/response interfaces

### 6.5 Security and Safety Considerations

**Content Safety**:
- Family-friendly story rule embedded in prompt: "Keep it engaging and family-friendly"
- Future phases plan for additional content moderation filters

**API Security**:
- API keys stored in environment variables (`.env`)
- CORS enabled for frontend-backend separation
- Flask `SECRET_KEY` for session security

**Data Protection**:
- No user authentication in Phase I (anonymous sessions)
- SQLite database file access controlled by filesystem permissions

### 6.6 Caching Strategy

The system implements multiple caching layers to optimize performance:

1. **TTS Audio Caching**:
   - On-disk cache in `tts_cache/` directory
   - SHA-256 hash keys incorporating text content, language, speaker, and voice file hash
   - Eliminates redundant synthesis for repeated narration
   - Atomic file operations (write to temp, then replace) prevent corruption

2. **Personality Profile Caching**:
   - Database-level caching with history fingerprinting
   - Stale detection based on fingerprint mismatch
   - 90-second processing TTL prevents duplicate in-flight analyses

3. **Image Generation Caching**:
   - Implicit caching through base64 storage in frontend state
   - Could be extended to server-side caching for repeated prompts

### 6.7 Error Handling and Resilience

The system implements multiple fallback mechanisms:

1. **AI Response Resilience**:
   - Multi-layer JSON parsing (direct, fenced, regex extraction)
   - Fallback response generators for malformed AI outputs
   - Mock response mode when API key is absent (keyword-based story selection)

2. **TTS Resilience**:
   - Automatic fallback to simpler calling conventions if initial synthesis fails
   - Multiple TTS engines available if one fails

3. **Service Unavailability**:
   - Graceful degradation when external APIs (Perplexity, Cloudflare, Deepgram) are unavailable
   - Local-only operation possible with XTTS or Qwen TTS (no API keys required)

---

## 7. System Integration Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           INTERACTIVE STORY GAME                                    │
│                              Data Flow Architecture                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   PLAYER     │
  └──────┬───────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                              FRONTEND (React)                                   │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
  │  │ StoryArea    │  │ Choices      │  │ Character    │  │ PersonalityReveal   │ │
  │  │ (Display)    │  │ (Input)      │  │ InfoCard     │  │ Dialog              │ │
  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────────┘ │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                        │
  │  │ HistoryPanel │  │ Save/Load    │  │ Narration    │                        │
  │  │              │  │ Dialogs      │  │ Player       │                        │
  │  └──────────────┘  └──────────────┘  └──────────────┘                        │
  └────────────────────────┬───────────────────────────────────────────────────────┘
                           │ REST API (JSON)
                           ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                           BACKEND (Flask/Python)                                │
  │                                                                                 │
  │  ┌────────────────────────────────────────────────────────────────────────┐    │
  │  │                         ROUTE LAYER                                     │    │
  │  │  /api/game/start    /api/game/choice    /api/game/save    /api/game/load│    │
  │  │  /api/narrate       /api/story/generate                                 │    │
  │  └────────────────────────────────────────────────────────────────────────┘    │
  │                                     │                                          │
  │  ┌──────────────────────────────────┼──────────────────────────────────────┐  │
  │  │                         SERVICE LAYER                                   │  │
  │  │                                                                          │  │
  │  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │  │
  │  │  │ AIStoryService  │  │ PersonalityServ. │  │ ImageGenerationService  │ │  │
  │  │  │                 │  │                  │  │                         │ │  │
  │  │  │ • Prompt Builder│  │ • History Parser │  │ • Prompt→FLUX.1         │ │  │
  │  │  │ • JSON Parser   │  │ • Trait Scorer   │  │ • Base64 Encode         │ │  │
  │  │  │ • Response Norm │  │ • Archetype Gen  │  │ • Return Image          │ │  │
  │  │  └────────┬────────┘  └────────┬─────────┘  └────────────┬────────────┘ │  │
  │  │           │                   │                         │              │  │
  │  │  ┌────────▼───────────────────▼─────────────────────────▼────────────┐  │  │
  │  │  │                    TTS SERVICE LAYER                               │  │  │
  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │  │  │
  │  │  │  │ TTSSynth    │  │ QwenSynth   │  │ DeepgramSynth           │  │  │  │
  │  │  │  │ (XTTS v2)   │  │ (Qwen3 TTS) │  │ (Aura-2 API)            │  │  │  │
  │  │  │  │             │  │             │  │                         │  │  │  │
  │  │  │  │ • Voice     │  │ • Uncle Fu  │  │ • Orpheus Voice         │  │  │  │
  │  │  │  │   Cloning   │  │ • 10 Langs  │  │ • Cloud-based           │  │  │  │
  │  │  │  │ • 16+ Langs │  │ • Instruct  │  │ • MP3 Output            │  │  │  │
  │  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │  │  │
  │  │  └──────────────────────────────────────────────────────────────────┘  │  │
  │  └────────────────────────────────────────────────────────────────────────┘  │
  │                                     │                                        │
  │  ┌──────────────────────────────────┼──────────────────────────────────────┐ │
  │  │                      DATABASE LAYER (SQLite)                            │ │
  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐ │ │
  │  │  │ game_sessions │  │ saved_games   │  │ personality_profiles      │ │ │
  │  │  │               │  │               │  │                           │ │ │
  │  │  │ • session_id  │  │ • save_name   │  │ • history_fingerprint     │ │ │
  │  │  │ • context     │  │ • game_state  │  │ • trait_scores (JSON)     │ │ │
  │  │  │ • history     │  │ • saved_at    │  │ • archetype               │ │ │
  │  │  └───────────────┘  └───────────────┘  └───────────────────────────┘ │ │
  │  └────────────────────────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────┬────────────────────────────────────────┘
                                        │ HTTPS/JSON
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │  Perplexity AI  │      │ Cloudflare AI   │      │   Deepgram API  │
  │                 │      │                 │      │                 │
  │ • Sonar Model   │      │ • FLUX.1        │      │ • Aura-2 TTS    │
  │ • Story Gen     │      │   [schnell]     │      │ • Orpheus Voice │
  │ • Personality   │      │ • Image Gen     │      │                 │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 8. Technology Summary

### 8.1 AI/ML Models Inventory

| Category | Model/Service | Provider | Purpose |
|----------|---------------|----------|---------|
| **LLM** | Sonar | Perplexity AI | Story generation, personality analysis |
| **TTS** | XTTS v2 | Coqui | Multilingual synthesis with voice cloning |
| **TTS** | Qwen3-TTS-12Hz-0.6B-CustomVoice | Qwen | Character-driven narration |
| **TTS** | Aura-2 Orpheus | Deepgram | Cloud-based English narration |
| **Image** | FLUX.1 [schnell] | Black Forest Labs/Cloudflare | Scene visualization |

### 8.2 Infrastructure Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 18.3.1 |
| Frontend Language | TypeScript | 5.6.2 |
| Build Tool | Vite | 5.4.8 |
| Styling | Tailwind CSS | 3.4.14 |
| Backend Framework | Flask | 2.3.3 |
| Backend Language | Python | 3.11-3.13 |
| Database | SQLite | 3.x |
| ML Framework | PyTorch | 2.5.1+cu121 |
| Package Manager (BE) | UV | Latest |
| Package Manager (FE) | PNPM | Latest |

### 8.3 Key Dependencies

**Backend**:
- `coqui-tts==0.27.1` — XTTS v2 text-to-speech
- `transformers>=4.57.3` — Hugging Face transformers (for Qwen TTS)
- `torch==2.5.1+cu121` — PyTorch with CUDA 12.1
- `flash-attn>=2.7.3` — Flash Attention 2 for efficient inference
- `requests==2.32.5` — HTTP client for API calls
- `flask==2.3.3` / `flask-cors==4.0.0` — Web framework
- `qwen-tts` — Qwen3 TTS model (custom package)

**Frontend**:
- `framer-motion` — Animation library
- `@radix-ui/*` — Headless UI primitives
- `lucide-react` — Icon library
- `sonner` — Toast notifications
- `tailwindcss-animate` — Animation utilities

---

## 9. Future Enhancement Opportunities

Based on the Phase I architecture, the following enhancements are architecturally feasible:

1. **User Authentication**: Extend database schema with `users` table; add JWT authentication to API layer
2. **Content Moderation**: Integrate safety classifiers (e.g., Perspective API) to filter AI outputs
3. **Multiplayer Support**: Extend session model to support multiple players making collaborative choices
4. **Voice Cloning UI**: Allow players to upload voice samples for personalized narration
5. **Analytics Dashboard**: Aggregate personality profiles across sessions to show player archetype distributions
6. **Mobile Application**: React Native wrapper around existing API layer
7. **Story Genre Templates**: Extend prompt templates for different genres (sci-fi, horror, mystery, romance)
8. **Achievement System**: Track specific choice patterns to unlock narrative achievements

---

## 10. Conclusion

The Interactive Story Game represents a sophisticated integration of modern AI technologies to solve the scalability challenges of branching narrative design. By combining Perplexity's Sonar LLM for story generation, multiple TTS engines for accessibility, FLUX.1 for visual immersion, and a custom personality inference system, the application delivers a personalized, replayable storytelling experience that adapts to individual player choices.

The modular architecture—with clear separation between frontend, backend, AI services, and persistence layers—positions the system for iterative enhancement while maintaining the core gameplay loop of choice-driven narrative generation.

---

*Report Generated: March 12, 2026*
*Project Phase: Phase I (Functional Prototype)*
