# Melow Sales Intelligence & Deal Room Agent

AI-powered sales call analysis, MEDPICC scoring, and shareable deal room generation.

## Architecture

```
backend/          FastAPI + Claude API
  app/
    agents/       Speaker inference, Call analysis, MEDPICC, Deal room
    models/       Pydantic schemas
    prompts/      Structured LLM prompt templates
    routers/      API endpoints
    storage/      JSON file storage (v1)
frontend/         Next.js + TypeScript + Tailwind CSS
  src/
    app/          Pages (main + shareable deal room)
    components/   Tab components (CallAnalysis, MEDPICC, DealRoom)
    lib/          API client
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Workflow

1. Paste a sales call transcript
2. Click "Analyze Call"
3. View results across three tabs: Call Analysis, MEDPICC, Deal Room
4. Click "Create Deal Room" to generate a shareable link

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/analyze` | Analyze a transcript (speaker inference + call scoring + MEDPICC) |
| POST | `/api/deal-room` | Generate a deal room from an analysis |
| GET | `/api/deal-room/{id}` | Fetch a deal room by ID |
| GET | `/api/analysis/{id}` | Fetch a stored analysis by ID |
| GET | `/health` | Health check |
