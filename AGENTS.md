# Interactive Story Game - Agent Guide

## Project Overview
This project is an interactive story game application consisting of a React-based frontend and a Python Flask backend. The game features interactive storytelling where users make choices that affect the narrative, potentially supported by AI generation and TTS (Text-to-Speech) capabilities.

## Tech Stack

### Frontend (`/frontend-react`)
- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI + Tailwind)
- **Package Manager:** pnpm
- **State Management:** React Hooks / Context
- **Routing:** (Currently single-page or simple routing structure)

### Backend (`/backend`)
- **Framework:** Flask
- **Language:** Python
- **Package Manager:** uv
- **AI/ML:** PyTorch, Coqui TTS, Transformers (Hugging Face)
- **Database:** SQLite

## Project Structure

```
interactive-story-game/
├── frontend-react/       # React Frontend Application
│   ├── src/
│   │   ├── modules/      # Feature-based modules (App, UI components)
│   │   ├── api/          # API integration
│   │   └── lib/          # Utilities
│   ├── components/ui/    # Shadcn UI components (Top-level or inside src)
│   └── package.json
└── backend/              # Flask Backend Application
    ├── app.py            # Main entry point
    ├── routes/           # API Endpoints
    ├── services/         # Business logic & AI services
    ├── database/         # SQLite DB
    └── pyproject.toml    # Python dependencies (managed by uv)
```

## Setup & Running

### Frontend
1. Navigate to `frontend-react`:
   ```bash
   cd frontend-react
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run development server:
   ```bash
   pnpm dev
   ```

### Backend
1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies using `uv`:
   ```bash
   uv sync
   ```
3. Run the application:
   ```bash
   uv run python app.py
   ```
   Or via specific run scripts if available.

### Development Notes
- **Shadcn UI:** When adding new UI components, follow the Shadcn pattern.
- **Tailwind:** Ensure `tailwind.config.js` includes all content paths.
- **API:** The backend runs on port 5000 by default. Ensure the frontend proxy or CORS settings allow communication.
