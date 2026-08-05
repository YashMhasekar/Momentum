# Security Policy

Momentum takes security seriously. This document outlines how to report vulnerabilities, how secrets are managed, and the security practices enforced across the project.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main` branch) | Yes |
| Previous releases | No |

Security fixes are applied to the latest version on the `main` branch only.

---

## Reporting Security Issues

If you discover a security vulnerability, **do not** open a public GitHub issue with exploit details, proof-of-concept code, or sensitive information.

### Responsible Disclosure Process

1. **Report privately** via email to **YOUR_EMAIL@example.com** or a GitHub Security Advisory (if enabled on the repository).
2. **Include:**
   - A clear description of the vulnerability
   - Steps to reproduce (without destructive payloads)
   - Affected component (frontend, Express backend, AI service)
   - Potential impact assessment
3. **Allow time for a fix** — we aim to acknowledge reports within 48 hours and provide a remediation timeline within 7 days.
4. **Coordinate disclosure** — we will work with you on a responsible public disclosure timeline after the fix is deployed.

### What Not to Include

- Live exploit code or automated attack scripts
- Access to other users' data
- Social engineering attempts against maintainers

---

## Environment Variables

All sensitive configuration is loaded from environment variables at runtime. No secrets are hardcoded in source files.

| Location | Variables | Exposure |
|----------|-----------|----------|
| `frontend/.env` | `VITE_FIREBASE_*`, `VITE_GROQ_API_KEY`, etc. | Client-side (prefixed with `VITE_`) |
| `backend/ai-service/.env` | `GROQ_API_KEY` | Server-side only |
| `backend/server/` | `PORT` (optional) | Server-side only |

### Setup for Developers

```bash
# Frontend
cp frontend/.env.example frontend/.env

# AI Service
cp backend/ai-service/.env.example backend/ai-service/.env
```

Reference only the `.env.example` files in documentation. Never commit filled `.env` files.

---

## Firebase Credentials

### Client SDK (Frontend)

Firebase web configuration (`VITE_FIREBASE_*` variables) is designed for client-side use and is restricted by Firebase security rules and authorized domains.

### Admin SDK (Backend Server)

The file `backend/server/serviceAccountKey.json` grants full Firebase Admin access. Use `serviceAccountKey.json.example` as a template — never commit the real file.

**Rules:**

- Never commit `serviceAccountKey.json` to version control
- Store it locally for development only
- In production, inject credentials via environment secrets or a secure vault
- Rotate the key immediately if accidentally exposed via the [Firebase Console](https://console.firebase.google.com/)

### Firestore Security

- Production deployments must use restrictive Firestore security rules
- Enable Firebase App Check to prevent unauthorized API access
- Restrict authorized domains in Firebase Authentication settings

---

## API Key Management

The following API keys are used across the platform:

| Key | Service | Storage |
|-----|---------|---------|
| `GROQ_API_KEY` | Groq LLM inference | Server-side `.env` |
| `VITE_GROQ_API_KEY` | Client-side AI features | Frontend `.env` |
| `VITE_GEMINI_API_KEY` | Gemini fallback AI | Frontend `.env` |
| `VITE_YOUTUBE_API_KEY` | YouTube Study Reels | Frontend `.env` |
| `VITE_GITHUB_TOKEN` | GitHub integration | Frontend `.env` |
| `VITE_GOOGLE_CLIENT_ID` | Google Calendar OAuth | Frontend `.env` |
| `OPENROUTER_API_KEY` | OpenRouter fallback | Frontend `.env` |

**Best practices:**

- Rotate keys immediately if exposed in a commit, screenshot, or log
- Use separate keys for development and production environments
- Set API usage quotas and billing alerts in provider dashboards
- Never log API keys in server output or browser console

---

## Dependency Updates

Keep dependencies current to receive security patches:

```bash
# Frontend
cd frontend && npm audit

# Backend server
cd backend/server && npm audit

# AI service
cd backend/ai-service && pip list --outdated
```

Report dependency vulnerabilities through the responsible disclosure process above.

---

## Security Best Practices

### Authentication

- Firebase Authentication handles all user sessions with secure tokens
- Protected routes enforce role-based access (`student`, `college_admin`)
- OAuth providers (Google, GitHub) use Firebase-managed OAuth flows

### API Security

- Express backend uses CORS restricted to `localhost:5173` and `localhost:3000` in development
- FastAPI AI service should restrict CORS in production (currently open for development)
- All API keys are transmitted over HTTPS in production deployments

### Repository Hygiene

- `.gitignore` excludes `.env`, `serviceAccountKey.json`, `venv/`, `node_modules/`, and build artifacts
- CI pipeline does not inject production secrets
- No credentials are stored in the repository, commit history, or documentation

### Production Checklist

- [ ] All `.env` files configured via deployment platform secrets
- [ ] Firestore security rules deployed and tested
- [ ] Firebase authorized domains configured for production URL
- [ ] CORS restricted to production frontend domain
- [ ] API keys rotated from development values
- [ ] HTTPS enforced on all services
- [ ] Firebase App Check enabled

---

## Contact

| Channel | Details |
|---------|---------|
| **Security Email** | YOUR_EMAIL@example.com |
| **LinkedIn** | [YOUR_LINKEDIN](https://linkedin.com/in/YOUR_LINKEDIN) |
| **GitHub Issues** | Use `[SECURITY]` prefix only for non-sensitive coordination |

We appreciate responsible disclosure and will credit reporters who follow this process (with permission).
