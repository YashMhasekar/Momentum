# Contributing to Momentum

Thank you for your interest in contributing to Momentum. This guide covers everything you need to set up the project locally, follow our conventions, and submit high-quality contributions.

---

## Table of Contents

- [Fork Repository](#fork-repository)
- [Clone Repository](#clone-repository)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Folder Organization](#folder-organization)
- [Coding Standards](#coding-standards)
- [Commit Message Convention](#commit-message-convention)
- [Pull Requests](#pull-requests)
- [Issue Reporting](#issue-reporting)
- [Security](#security)

---

## Fork Repository

1. Navigate to [https://github.com/YOUR_USERNAME/Momentum](https://github.com/YOUR_USERNAME/Momentum)
2. Click **Fork** in the top-right corner
3. Clone your fork locally (see below)

---

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Momentum.git
cd Momentum
git remote add upstream https://github.com/ORIGINAL_OWNER/Momentum.git
```

Replace `YOUR_USERNAME` with your GitHub username and `ORIGINAL_OWNER` with the upstream repository owner.

---

## Installation

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.8+ |
| pip | Latest |
| Git | Latest |

You also need:

- A Firebase project with **Authentication** and **Firestore** enabled
- A **Groq API key** ([console.groq.com](https://console.groq.com))
- A Firebase **service account key** for the Express backend

### Step-by-Step Setup

```bash
# 1. Frontend
cd frontend
npm install
cp .env.example .env
# Edit .env — see frontend/.env.example for all required variables

# 2. Express backend
cd ../backend/server
npm install
cp serviceAccountKey.json.example serviceAccountKey.json
# Edit serviceAccountKey.json with your Firebase Admin credentials (never commit it)

# 3. AI service
cd ../ai-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Add GROQ_API_KEY to .env
```

---

## Running the Project

Three services must run concurrently for the full feature set.

### Terminal 1 — Frontend

```bash
cd frontend
npm run dev
```

App available at [http://localhost:5173](http://localhost:5173)

### Terminal 2 — Express Backend

```bash
cd backend/server
npm start
```

API available at [http://localhost:5000](http://localhost:5000)

### Terminal 3 — AI Service

```bash
cd backend/ai-service
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
python chatbot_api.py
```

API docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Helper Scripts (Windows)

Run from the project root:

```bash
scripts\check_services.bat          # Check if all services are running
scripts\START_AI_SERVICE_NOW.bat    # Install deps and start AI service
scripts\start_emotion_detection.bat # Choose DeepFace or FER backend
scripts\start_backend.bat           # Start AI service with venv
```

### Build Verification

Before submitting a PR, verify the frontend builds:

```bash
cd frontend
npm run build
npm run lint
```

---

## Folder Organization

```
Momentum/
├── frontend/           # React + Vite — all UI code lives here
│   ├── src/
│   │   ├── components/ # Reusable UI (student/, college/, auth/, calendar/)
│   │   ├── contexts/   # React context (AuthContext)
│   │   ├── pages/      # Route-level page components
│   │   ├── services/   # API calls, Firebase operations, business logic
│   │   └── utils/      # Pure utility functions
│   └── public/         # Static assets
│
├── backend/
│   ├── server/         # Express API — analytics, emotion persistence, admin
│   └── ai-service/     # FastAPI — AI mentor, emotion detection, stress analysis
│
├── docs/               # Extended documentation
├── scripts/            # Startup helper scripts
├── screenshots/        # README screenshots
└── .github/            # CI, issue templates, PR template
```

### Where to Put New Code

| Change Type | Location |
|-------------|----------|
| New student UI component | `frontend/src/components/student/` |
| New admin UI component | `frontend/src/components/college/` |
| New API service call | `frontend/src/services/` |
| New Express route | `backend/server/server.js` |
| New FastAPI endpoint | `backend/ai-service/chatbot_api.py` |
| New documentation | `docs/` |

---

## Coding Standards

### JavaScript / React

- Use **functional components** with hooks — no class components
- Extract business logic into `services/`, keep components focused on rendering
- Use **Tailwind CSS** for styling; match existing patterns in the codebase
- Follow existing file naming: `PascalCase.jsx` for components, `camelCase.js` for services
- Run `npm run lint` before committing

### Python

- Follow **PEP 8** style conventions
- Use type hints on function signatures where practical
- Keep FastAPI route handlers thin; extract logic into helper modules
- Add docstrings for non-obvious business logic

### General Rules

- Do not commit secrets, API keys, or credential files
- Do not modify unrelated code in the same PR
- Preserve existing import paths and module structure
- Write self-documenting code; comments only for non-obvious logic
- Keep PRs focused — one feature or fix per pull request

---

## Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

<optional body explaining why, not what>
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no behavior change |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependency updates |

### Examples

```
feat(student): add weekly productivity chart to analytics page

fix(ai-service): resolve CORS error on emotion detection endpoint

docs: add Firestore schema to README_DATABASE.md

chore(ci): add Python syntax check to GitHub Actions workflow
```

---

## Pull Requests

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the coding standards above

3. **Verify locally:**
   ```bash
   cd frontend && npm run build && npm run lint
   cd ../backend/server && node --check server.js
   cd ../ai-service && python -m py_compile chatbot_api.py
   ```

4. **Push and open a PR** against `main`:
   ```bash
   git push origin feat/your-feature-name
   ```

5. **Fill out the PR template** — describe what changed and why

6. **Wait for review** — address feedback promptly

### PR Checklist

- [ ] Code follows project conventions
- [ ] No secrets or credentials committed
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Documentation updated if behavior changed
- [ ] PR description explains the change clearly

---

## Issue Reporting

Use the GitHub issue templates:

- **Bug Report** — `.github/ISSUE_TEMPLATE/bug_report.md`
- **Feature Request** — `.github/ISSUE_TEMPLATE/feature_request.md`

Include:

- Clear steps to reproduce (for bugs)
- Expected vs. actual behavior
- Environment details (OS, browser, Node.js version)
- Screenshots or error logs when applicable

For security issues, see [SECURITY.md](SECURITY.md) — do not use public issues.

---

## Security

- Never commit `.env` files, `serviceAccountKey.json`, or API keys
- Use `.env.example` files as templates only
- Report vulnerabilities privately via [SECURITY.md](SECURITY.md)

---

Thank you for contributing to Momentum.
