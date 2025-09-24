# Interactive Story Game — React Frontend

Modern React + TypeScript frontend for the Interactive Story Game. Built with Vite, Tailwind CSS, Radix primitives, and Framer Motion.

## Tech
- React 18 + TypeScript
- Vite
- Tailwind CSS (+ tailwindcss-animate)
- Radix UI primitives (Dialog)
- Framer Motion

## Setup

1. Ensure the backend is running at `http://localhost:5000`.
2. Install dependencies and start the dev server (pnpm):

```bash
cd frontend-react
pnpm install
pnpm dev
```

3. Open the app at `http://localhost:5173`.

### Environment
Optionally set an API base URL:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5000/api
```

## Scripts
- `pnpm dev` — start development server
- `pnpm build` — type-check and build for production
- `pnpm preview` — preview the production build

## Project Structure
```
src/
  api/            # API client and endpoints
  lib/            # utilities (classNames, keys)
  modules/
    app/          # App shell and page composition
    ui/           # Reusable UI components
  types/          # shared TypeScript types for API
```

## Notes
- Keyboard shortcuts 1/2/3 trigger choices.
- The session is restored from localStorage if available.
- Save/Load uses Radix Dialogs with Tailwind styling.
- Lightweight toast system provides success/error feedback.
