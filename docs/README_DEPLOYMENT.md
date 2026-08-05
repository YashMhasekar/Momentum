# Deployment Guide

This document covers deploying Momentum's three services to production environments.

---

## Overview

| Service | Technology | Production URL | Recommended Platform |
|---------|-----------|---------------|---------------------|
| Frontend | React + Vite | [momentum01.netlify.app](https://momentum01.netlify.app) | Netlify |
| Backend | Express + Firebase Admin | <!-- TODO: Add production URL --> | Railway, Render, VPS |
| AI Service | FastAPI + Groq | <!-- TODO: Add production URL --> | Railway, Render, GPU VPS |

---

## Frontend — Netlify

The frontend is deployed at **https://momentum01.netlify.app**.

### Netlify Setup

1. **Connect repository** to Netlify via GitHub integration
2. **Configure build settings:**

   | Setting | Value |
   |---------|-------|
   | Base directory | `frontend` |
   | Build command | `npm run build` |
   | Publish directory | `frontend/dist` |
   | Node version | 20 |

3. **Add environment variables** in Netlify dashboard (Site settings → Environment variables):

   Copy all variables from `frontend/.env.example` and fill in production values:

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_GROQ_API_KEY=
   ```

4. **Configure redirects** for SPA routing. Create `frontend/public/_redirects`:

   ```
   /*    /index.html   200
   ```

   <!-- TODO: Verify _redirects file exists or add it -->

5. **Deploy** — Netlify auto-deploys on push to `main`

### Custom Domain

<!-- TODO: Document custom domain setup if applicable -->

1. Add custom domain in Netlify dashboard
2. Configure DNS records as instructed by Netlify
3. Enable HTTPS (automatic via Let's Encrypt)

### Build Verification

```bash
cd frontend
npm run build
# Output: frontend/dist/
npx serve dist   # Local preview of production build
```

---

## Backend — Express Server

### Railway / Render Deployment

1. **Create a new service** connected to the GitHub repository
2. **Configure:**

   | Setting | Value |
   |---------|-------|
   | Root directory | `backend/server` |
   | Start command | `node server.js` |
   | Node version | 20 |

3. **Set environment variables:**

   ```
   PORT=5000
   ```

4. **Firebase Admin credentials:**

   Option A — Environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
   ```
   <!-- TODO: Update server.js to read from env var if not already supported -->

   Option B — Mount as secret file at runtime

5. **Update CORS** in `server.js` for production frontend domain:
   ```javascript
   origin: ['https://momentum01.netlify.app']
   ```

### VPS Deployment (Manual)

```bash
# On the server
git clone https://github.com/YOUR_USERNAME/Momentum.git
cd Momentum/backend/server
npm install --production

# Copy serviceAccountKey.json.example → serviceAccountKey.json and add your credentials
# Or inject credentials via deployment platform secrets
export PORT=5000
node server.js

# Or use PM2 for process management
npm install -g pm2
pm2 start server.js --name momentum-api
pm2 save
pm2 startup
```

### Health Check

```bash
curl https://your-backend-url.com/
```

---

## AI Service — FastAPI

### Railway / Render Deployment

1. **Create a new service** with Python runtime
2. **Configure:**

   | Setting | Value |
   |---------|-------|
   | Root directory | `backend/ai-service` |
   | Start command | `uvicorn chatbot_api:app --host 0.0.0.0 --port 8000` |
   | Python version | 3.11 |

3. **Set environment variables:**

   ```
   GROQ_API_KEY=your_production_key
   ```

4. **Update CORS** in `chatbot_api.py` for production:
   ```python
   allow_origins=["https://momentum01.netlify.app"]
   ```

5. **Update frontend service URLs** to point to production AI service:
   - `frontend/src/services/aiMentorService.js`
   - `frontend/src/services/emotionDetectionService.js`
   - `frontend/src/services/stressDetectionService.js`

   <!-- TODO: Move hardcoded URLs to environment variables for easier deployment -->

### GPU VPS (Recommended for Emotion Detection)

For production emotion detection with acceptable latency:

```bash
# Ubuntu with NVIDIA GPU
cd backend/ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with Gunicorn + Uvicorn workers
pip install gunicorn
gunicorn chatbot_api:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Health Check

```bash
curl https://your-ai-service-url.com/health
# {"status":"healthy","database":"connected","llm":"connected"}
```

---

## Firebase Configuration

### Authentication

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to **Authentication → Settings → Authorized domains**
3. Add production domains:
   - `momentum01.netlify.app`
   - Your custom domain (if applicable)

### Firestore

1. Deploy security rules (see [README_DATABASE.md](README_DATABASE.md))
2. Create required composite indexes
3. Enable Firebase App Check for production

### Service Account

1. Generate a new service account key for production (separate from development)
2. Store securely in deployment platform secrets
3. Never commit to version control

---

## Environment Variables Summary

### Production Checklist

- [ ] `frontend/.env` variables set in Netlify dashboard
- [ ] `GROQ_API_KEY` set in AI service deployment
- [ ] `serviceAccountKey.json` injected as secret in backend deployment
- [ ] CORS updated on Express and FastAPI for production domain
- [ ] Firebase authorized domains include production URL
- [ ] Firestore security rules deployed
- [ ] All development API keys rotated for production

---

## CI/CD

GitHub Actions CI runs on every push (see `.github/workflows/ci.yml`):

- Installs Node.js and Python dependencies
- Builds the frontend
- Checks backend and AI service syntax

<!-- TODO: Add deployment workflow when backend and AI service URLs are finalized -->

---

## Monitoring

<!-- TODO: Document monitoring setup -->

| Service | Health Endpoint | Recommended Tool |
|---------|----------------|-----------------|
| Frontend | Netlify deploy status | Netlify dashboard |
| Express | `GET /` | UptimeRobot, Better Stack |
| FastAPI | `GET /health` | UptimeRobot, Better Stack |

---

## Docker (Future)

<!-- TODO: Add Docker Compose configuration -->

Planned `docker-compose.yml` structure:

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]

  backend:
    build: ./backend/server
    ports: ["5000:5000"]

  ai-service:
    build: ./backend/ai-service
    ports: ["8000:8000"]
```

---

## Related Documentation

- [Architecture](README_ARCHITECTURE.md)
- [API Reference](README_API.md)
- [AI Service](README_AI.md)
- [Security Policy](../SECURITY.md)
