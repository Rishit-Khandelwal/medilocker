# MediLocker

> A full-stack healthcare SaaS platform with a local RAG/AI pipeline, real-time WebSocket notifications, role-based access control, and emergency medical access — built entirely with open-source tools, zero paid APIs required.

---

## What is MediLocker?

MediLocker is a personal health record management system that lets patients securely store medical documents, track appointments and medications, grant emergency access via QR codes, and interact with an AI assistant that reads and explains their own records — all without sending data to third-party services.

Doctors see their appointment queue and consultation history. Emergency responders can scan a QR code to access critical health information for 15 minutes. Admins can verify professional credentials and manage the platform. Every action is audit-logged.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | Django 4.2 + Django REST Framework |
| Auth | JWT (SimpleJWT) with refresh rotation + blacklisting |
| Database | PostgreSQL 16 |
| Async tasks | Celery 5 + Redis 7 (worker + beat scheduler) |
| Real-time | Django Channels 4 + Daphne (WebSocket over ASGI) |
| Vector DB | Qdrant (local, Docker) |
| Embeddings | fastembed — BAAI/bge-small-en-v1.5 (ONNX, no GPU) |
| OCR | PyMuPDF (digital PDFs) + Tesseract (scanned pages/images) |
| LLM | Ollama (local) with Gemini 1.5 Flash (free tier) fallback |
| File validation | MIME magic-byte detection (not just extension) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 — design token system (light/dark via CSS variables) |
| UI | Lucide icons, Framer Motion (page transitions, modals) |
| Real-time | Native WebSocket with auto-reconnect |
| AI streaming | Native fetch SSE reader (no library) |
| State | React Context (Auth, Theme, Toast, Notifications) |

### Infrastructure
| Service | Technology |
|---|---|
| Reverse proxy | Nginx (React SPA + Django API + WebSocket on one port) |
| Containerisation | Docker + Docker Compose (7 services, single command) |
| Production server | Daphne ASGI (HTTP + WebSocket) |

---

## Features

### Phase 1 — Authentication
- Email-based login (not username)
- JWT access + refresh tokens with blacklisting on logout
- Token auto-refresh via Axios interceptor — silent re-auth
- User + Profile models; password hashing

### Phase 2 — Medical Records
- File upload: PDF, PNG, JPEG (max 20 MB)
- MIME magic-byte validation — cannot be spoofed by renaming
- Metadata: title, category, description, tags, version counter
- Authenticated file download (no direct media URL access)
- Categories: Lab Report, Prescription, MRI, CT Scan, X-Ray, Vaccination, Other

### Phase 3+4 — Security & Emergency Access
- **RBAC**: 5 roles — Patient, Doctor, Emergency Responder, Admin, SuperAdmin
- Custom DRF permission classes per role
- Rate limiting: login (5/min), uploads (30/hr), emergency access (10/min)
- **Audit logs** via Django signals — login, logout, upload, download, delete
- **Emergency contacts** with single-primary enforcement
- **One-time QR tokens**: 256-bit cryptographically random, 15-minute expiry, marks used on first scan, revocable
- QR code returned as base64 PNG — downloadable, printable
- **Public emergency page** (no login): shows blood group, allergies, conditions, medications, contacts

### Phase 5 — Timeline
- Appointments with optional doctor account linking via email
- Medications with dose, frequency, start/end dates
- Chronological timeline merging records + appointments + medications
- Upcoming reminders widget on patient dashboard

### Phase 6 — Real-Time Notifications
- Django Channels WebSocket consumer with JWT query-param auth
- Celery signals fire instantly: upload complete, emergency QR scanned
- Celery beat schedules: appointment reminders (15-min window), daily medication reminders
- Dedup guard via `ReminderLog` — never double-sends
- Notification bell with unread badge, dropdown feed, mark-read, mark-all-read

### Phase 7 — OCR + RAG (Semantic Search)
- **OCR pipeline**: PyMuPDF for digital PDFs → Tesseract fallback for scanned pages
- **Chunking**: 200-word sliding window with 40-word overlap
- **Embeddings**: fastembed BAAI/bge-small-en-v1.5 (384-dim, runs locally via ONNX)
- **Vector store**: Qdrant with per-user cosine similarity search
- Automatic indexing on upload via Celery task; manual reindex endpoint
- Search UI with relevance score bars and example queries

### Phase 8 — AI Health Copilot
- **Dual backend**: Ollama (local, fully offline) + Gemini 1.5 Flash (free tier fallback)
- Auto-detection: tries Ollama → falls back to Gemini → clear error if neither
- **RAG integration**: top 3 relevant chunks injected as context before every response
- **Streaming**: SSE via Django `StreamingHttpResponse` → native fetch reader in React
- Persistent chat sessions with rename, delete, and full history
- System prompt enforces non-diagnostic boundary
- "Ask AI about this record" button on every record detail page

### Role-Based Dashboards
| Role | Live Data Shown |
|---|---|
| Patient | Records count, appointments, medications, emergency contacts, health overview, upcoming appointments, recent records |
| Doctor | Today's appointment queue, recent consultations, upcoming appointments, prescription history, emergency cases |
| Responder | Recent emergency token access log with IP and timestamp |
| Admin | User counts, role distribution, pending verifications, recent audit log |
| SuperAdmin | Platform-wide stats + placeholder expansion sections |

### UI/UX
- Light + dark mode with CSS variable token system; FOUC-prevented (pre-paint script)
- Collapsible sidebar with role-aware navigation
- Framer Motion page transitions
- Skeleton loaders, toast notifications, Modal + Drawer primitives
- Split-screen login page; single-form registration with document upload
- Professional data tables with sort, pagination, sticky header
- Empty states with actions (not "no data found")

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         Nginx                           │
│   /          → React SPA (built into nginx image)      │
│   /api/      → Django (Daphne ASGI, port 8000)         │
│   /ws/       → Django Channels WebSocket (same port)   │
│   /static/   → Named Docker volume                     │
│   /media/    → Named Docker volume                     │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐           ┌────▼────┐
         │ Django  │           │ Celery  │
         │ Daphne  │           │ Worker  │
         └────┬────┘           └────┬────┘
              │                     │
    ┌─────────┼──────────┬──────────┘
    │         │          │
┌───▼──┐ ┌───▼──┐ ┌─────▼────┐
│  PG  │ │Redis │ │  Qdrant  │
└──────┘ └──────┘ └──────────┘
```

### App modules

```
backend/apps/
├── accounts/      # Users, roles, profiles, verification requests
├── records/       # Medical file upload, MIME validation, CRUD
├── audit/         # AuditLog model, signal handlers, REST views
├── emergency/     # Emergency contacts, one-time tokens, QR generation
├── timeline/      # Appointments, medications, doctor dashboard API
├── notifications/ # Notification model, Celery tasks, WS consumer
├── rag/           # OCR, chunking, embedding, Qdrant upsert/search
└── ai_assistant/  # Chat sessions, LLM routing, SSE streaming
```

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Git
- Tesseract OCR binary (Linux: `apt install tesseract-ocr`; Windows: [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki))
- Ollama (optional, for local AI): [ollama.com](https://ollama.com)

### Quick start

```bash
# 1. Clone
git clone https://github.com/yourusername/medilocker.git
cd medilocker

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env:
#   - Set a strong SECRET_KEY
#   - Set DB_PASSWORD
#   - Optionally add GEMINI_API_KEY (free at aistudio.google.com/app/apikey)

# 3. Build and start all 7 services
docker compose up --build -d

# 4. Create a superuser
docker compose exec backend python manage.py createsuperuser

# 5. (Optional) Start Ollama for fully local AI
docker compose --profile ollama up -d
docker compose exec ollama ollama pull llama3.2:3b

# App:         http://localhost
# Admin panel: http://localhost/admin
```

### Local development (without Docker)

```bash
# Terminal 1 — Django
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # set DB_HOST=localhost, REDIS_HOST=localhost, QDRANT_HOST=localhost
python manage.py migrate
python manage.py runserver

# Terminal 2 — Celery worker
celery -A config worker -l info --pool=solo

# Terminal 3 — Celery beat
celery -A config beat -l info

# Terminal 4 — Frontend
cd frontend
npm install
npm run dev

# Also run Redis and Qdrant locally:
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 6333:6333 qdrant/qdrant
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key — change in production | — |
| `DEBUG` | Enable debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost` |
| `DB_*` | PostgreSQL connection settings | see `.env.example` |
| `REDIS_HOST` | Redis host | `redis` |
| `CELERY_BROKER_URL` | Celery broker (Redis URL) | — |
| `QDRANT_HOST` | Qdrant host | `qdrant` |
| `TESSERACT_CMD` | Path to tesseract binary (Windows only) | empty |
| `AI_PROVIDER` | `auto` \| `ollama` \| `gemini` | `auto` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://ollama:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2:3b` |
| `GEMINI_API_KEY` | Google Gemini API key (free tier) | empty |
| `GEMINI_API_KEY` | Free key at [aistudio.google.com](https://aistudio.google.com/app/apikey) | empty |

---

## API Overview

| Prefix | App | Key endpoints |
|---|---|---|
| `/api/auth/` | accounts | register, login, refresh, logout, me, profile, verification-status, admin/stats |
| `/api/records/` | records | CRUD, download, stats |
| `/api/security/` | audit | my logs, recent (admin), emergency accesses |
| `/api/emergency/` | emergency | contacts CRUD, tokens (generate/revoke), public access |
| `/api/timeline/` | timeline | appointments CRUD, medications CRUD, feed, patient-stats, doctor-dashboard |
| `/api/notify/` | notifications | list, unread-count, mark-read, mark-all-read |
| `/api/search/` | rag | semantic search, OCR status, reindex |
| `/api/ai/` | ai_assistant | chat (SSE), sessions CRUD, rename, LLM status |

---

## Design Decisions

**Why magic-byte MIME validation instead of extension checking?**
A user can rename `malware.exe` to `report.pdf`. PyMuPDF reading the first 8 bytes catches this at the file-content level before anything is stored.

**Why `extra_verification` JSONField on VerificationRequest?**
Future tamper-proof verification methods (blockchain hash, certificate serial, digital signature, issuer DID) can be attached without any schema migration. The field is documented but unused — the schema is forward-compatible by design.

**Why are JWT tokens passed via query string for WebSocket?**
Browsers do not allow custom headers on the native `WebSocket` constructor. The `?token=` query param approach is standard for WebSocket JWT auth — the middleware extracts and validates it before any consumer code runs.

**Why does the AI use a leading user/assistant pair for RAG context?**
Gemini's API requires strictly alternating user/model history. Injecting context as a synthetic exchange satisfies this constraint while keeping the actual system prompt clean and non-diagnostic.

**Why `ReminderLog` instead of a flag on the Appointment/Medication model?**
Phase 5 models stay completely clean and unaware of notification logic. The dedup guard is entirely the notification app's responsibility — this is the correct separation of concerns and means Phase 5 requires no migration if notification logic changes.

---

## Roadmap

- [ ] Phase 9 — LangGraph multi-agent orchestration (Medical, Retrieval, OCR, Reminder, Security, Notification, Conversation agents)
- [ ] Family Vault (shared records between family members with permission grants)
- [ ] Insurance policy and claims tracking
- [ ] Doctor-initiated prescriptions visible to patients
- [ ] Real dosing schedule parser for medication reminders
- [ ] Polygon blockchain SHA-256 hash logging for tamper detection
- [ ] PWA + mobile apps (React Native)
- [ ] Multi-tenant / organisation support (SuperAdmin layer)
- [ ] Prometheus + Grafana monitoring
- [ ] IPFS file pinning

---

## Project Structure

```
medilocker/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Auth, RBAC, verification workflow
│   │   ├── records/           # File upload, MIME validation, versioning
│   │   ├── audit/             # Immutable audit trail via Django signals
│   │   ├── emergency/         # One-time QR tokens, emergency contacts
│   │   ├── timeline/          # Appointments, medications, doctor API
│   │   ├── notifications/     # Celery tasks, WebSocket consumer, dedup
│   │   ├── rag/               # OCR pipeline, embeddings, Qdrant CRUD
│   │   └── ai_assistant/      # LLM routing, SSE streaming, chat sessions
│   ├── config/
│   │   ├── settings.py        # Environment-based, production-hardened
│   │   ├── urls.py            # All 8 app URL registrations
│   │   ├── asgi.py            # Daphne + Channels ProtocolTypeRouter
│   │   └── celery.py          # Celery app + beat schedule
│   ├── Dockerfile
│   ├── entrypoint.sh          # migrate + collectstatic + daphne
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── contexts/          # Auth, Theme, Toast, Notifications
│   │   ├── components/
│   │   │   ├── shell/         # Sidebar (role-aware), Topbar (live bell)
│   │   │   └── ui/            # Card, StatCard, Table, Modal, Drawer,
│   │   │                      # EmptyState, Skeleton
│   │   ├── pages/
│   │   │   ├── dashboards/    # 5 role-specific dashboards
│   │   │   ├── Login.jsx      # Split-screen with gradient hero
│   │   │   ├── Register.jsx   # Role selector + conditional doc upload
│   │   │   ├── Records.jsx
│   │   │   ├── RecordDetail.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Timeline.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Medications.jsx
│   │   │   ├── EmergencyManagement.jsx
│   │   │   ├── EmergencyPublic.jsx   # No auth, forced light palette
│   │   │   ├── Search.jsx            # RAG semantic search
│   │   │   ├── AIAssistant.jsx       # Streaming chat with session list
│   │   │   ├── Settings.jsx
│   │   │   └── PendingVerification.jsx
│   │   ├── styles/theme.css   # CSS variable token system (light + dark)
│   │   └── App.jsx
│   └── package.json
├── nginx/
│   ├── nginx.conf             # Proxy, WS upgrade, SPA catch-all, SSL stub
│   └── Dockerfile             # Multi-stage: node build → nginx serve
├── docker-compose.yml         # Production: 7 services
├── docker-compose.dev.yml     # Dev overrides: hot-reload, no nginx
└── README.md
```

---

## Screenshots

> Add screenshots here after running locally.
> Suggested: Login page, Patient dashboard, Records grid (dark mode), AI Copilot chat, Emergency page, Admin dashboard.

---

## Key Numbers

| Metric | Value |
|---|---|
| Backend apps | 8 |
| API endpoints | ~40 |
| Frontend pages | 15 + 5 role dashboards |
| Docker services | 7 |
| Roles | 5 (Patient, Doctor, Responder, Admin, SuperAdmin) |
| Embedding model size | ~130 MB (downloaded once) |
| AI backends | 2 (Ollama local + Gemini free tier) |
| Paid APIs required | 0 |

---

## License

MIT — see [LICENSE](LICENSE)

---

## Author

Built by [Rishit](https://github.com/Rishit-Khandelwal) — a full-stack developer focused on AI-integrated systems and healthcare technology.

> **Note:** This is a portfolio/learning project. It is not HIPAA-compliant and should not be used to store real patient data in a clinical setting without proper compliance review.
