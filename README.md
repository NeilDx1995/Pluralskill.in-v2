# PluralSkill.in

**AI-Powered Learning Management Platform** — Courses, Labs, Workshops, and AI-generated Learning Paths.

## Quick Start

```bash
# Clone and start
git clone https://github.com/NeilDx1995/Pluralskill.in.git
cd Pluralskill.in

# Copy env and add your keys
cp .env.production .env
# Edit .env — set JWT_SECRET (required) and GEMINI_API_KEY (for AI features)

# Start all services
docker-compose up --build -d

# Verify
curl http://localhost:8001/health    # Backend
open http://localhost:3000           # Frontend
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   MongoDB    │
│  React/Nginx │     │ FastAPI/     │     │   Mongo 7    │
│  Port 3000   │     │ Gunicorn     │     │  Port 27017  │
│              │     │  Port 8001   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │  Google     │
                     │  Gemini AI  │
                     └─────────────┘
```

| Service  | Technology                        | Port  |
|----------|-----------------------------------|-------|
| Frontend | React 19, Tailwind CSS, Nginx     | 3000  |
| Backend  | FastAPI, Gunicorn, Uvicorn Worker  | 8001  |
| Database | MongoDB 7 via Motor (async)        | 27017 |
| AI       | Google Gemini 2.0 Flash            | —     |

## Environment Variables

| Variable          | Required | Description                              |
|-------------------|----------|------------------------------------------|
| `JWT_SECRET`      | ✅       | Secret for JWT token signing             |
| `MONGO_URL`       | ✅       | MongoDB connection string                |
| `DB_NAME`         | ✅       | Database name (default: `pluralskill`)   |
| `GEMINI_API_KEY`  | ❌       | Google Gemini API key (for AI features)  |
| `CORS_ORIGINS`    | ❌       | JSON array of allowed origins            |
| `ENVIRONMENT`     | ❌       | `development` / `staging` / `production` |
| `SENTRY_DSN`      | ❌       | Sentry error monitoring DSN              |
| `GUNICORN_WORKERS`| ❌       | Number of Gunicorn workers (default: 2)  |

## API Endpoints

| Method | Path                          | Auth     | Description                |
|--------|-------------------------------|----------|----------------------------|
| POST   | `/api/auth/login`             | —        | Login                      |
| POST   | `/api/auth/signup`            | —        | Register                   |
| GET    | `/api/auth/me`                | Bearer   | Current user profile       |
| GET    | `/api/courses/`               | Optional | List courses (paginated)   |
| GET    | `/api/courses/:id`            | Optional | Course detail              |
| POST   | `/api/courses/:id/enroll`     | Bearer   | Enroll in course           |
| GET    | `/api/labs`                   | Optional | List labs (paginated)      |
| GET    | `/api/labs/:slug`             | Optional | Lab detail                 |
| GET    | `/api/workshops/`             | Optional | List workshops (paginated) |
| POST   | `/api/open-source/generate`   | Bearer   | AI-generate learning path  |
| GET    | `/api/open-source/paths`      | Bearer   | List saved paths           |
| GET    | `/health`                     | —        | Health check               |

**Pagination:** All list endpoints accept `?page=1&limit=12&search=term`

## Production Deployment

```bash
# Use production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or set environment directly
ENVIRONMENT=production GUNICORN_WORKERS=4 docker-compose up -d
```

## CI/CD

GitHub Actions runs on push/PR to `main`:
1. **Lint** — `black`, `isort`, `flake8`
2. **Build** — Docker images for backend + frontend

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/endpoints/    # Route handlers
│   │   ├── core/             # Config, security, logging
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # Business logic (AI, analytics)
│   │   ├── db/               # Database connection & seeding
│   │   └── main.py           # FastAPI app entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Shared UI components
│   │   ├── context/          # React context (Auth)
│   │   └── services/         # API client
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── .github/workflows/ci.yml
```

## License

Proprietary — © PluralSkill.in
