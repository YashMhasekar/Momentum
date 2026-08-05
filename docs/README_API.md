# API Reference

Complete reference for the Momentum Express backend and FastAPI AI service.

---

## Express Backend

**Base URL:** `http://localhost:5000` (development)

**Stack:** Node.js, Express 5, Firebase Admin SDK

**CORS:** Allowed origins — `http://localhost:5173`, `http://localhost:3000`

---

### Health Check

#### `GET /`

Returns server status.

**Response:**

```json
{
  "status": "Momentum Backend Server is running",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

### Extension Analytics

#### `POST /api/save-extension-data`

Save browser extension activity data for a user.

**Request Body:**

```json
{
  "userId": "string",
  "studyTime": 3600,
  "distractionTime": 600,
  "sites": [
    { "domain": "youtube.com", "time": 300, "category": "distraction" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "productivityRatio": 86,
  "momentumContribution": 42
}
```

---

#### `GET /api/get-extension-data/:userId`

Retrieve all extension data for a user.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |

**Response:** Array of daily extension records.

---

#### `GET /api/get-today-analytics/:userId`

Get today's study analytics for a user.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |

**Response:**

```json
{
  "studyTime": 7200,
  "distractionTime": 900,
  "productivityRatio": 89,
  "topSites": [],
  "focusScore": 85
}
```

---

#### `GET /api/get-weekly-analytics/:userId`

Get the past 7 days of analytics for a user.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |

**Response:** Array of 7 daily analytics objects.

---

### Emotion Detection

#### `POST /api/emotion/save-session`

Persist an emotion detection session to Firestore.

**Request Body:**

```json
{
  "userId": "string",
  "sessionId": "string",
  "emotions": [
    { "emotion": "happy", "confidence": 0.92, "timestamp": 1700000000 }
  ],
  "dominantEmotion": "happy",
  "wellnessScore": 85,
  "duration": 300
}
```

**Response:**

```json
{ "success": true, "sessionId": "string" }
```

---

#### `GET /api/emotion/history/:userId`

Get emotion detection session history for a user.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |

**Response:** Array of emotion session records.

---

#### `GET /api/emotion/analytics/:userId`

Get aggregated emotion analytics for a user.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |

**Response:**

```json
{
  "totalSessions": 12,
  "averageWellnessScore": 78,
  "dominantEmotions": { "happy": 5, "neutral": 4, "sad": 3 },
  "weeklyTrend": []
}
```

---

### Admin

#### `GET /api/admin/analytics`

Get institution-wide analytics for college administrators.

**Response:**

```json
{
  "totalStudents": 150,
  "averageMomentumScore": 72,
  "departmentBreakdown": [],
  "stressAlerts": [],
  "topPerformers": []
}
```

<!-- TODO: Document authentication requirements for admin endpoints -->

---

## FastAPI AI Service

**Base URL:** `http://127.0.0.1:8000` (development)

**Interactive Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Stack:** Python, FastAPI, Uvicorn, LangChain, Groq, DeepFace

---

### Health Check

#### `GET /health`

Check AI service health and connectivity.

**Response:**

```json
{
  "status": "healthy",
  "database": "connected",
  "llm": "connected"
}
```

---

#### `GET /`

Root endpoint with service information.

---

### AI Mentor

#### `POST /chat`

Send a message to the AI Mentor and receive a RAG-enhanced response.

**Request Body:**

```json
{
  "question": "How should I prepare for my calculus exam?",
  "user_id": "optional-user-id"
}
```

**Response:**

```json
{
  "answer": "Based on the study materials, focus on...",
  "sources": ["document1.pdf", "document2.pdf"]
}
```

**Pipeline:** Question → ChromaDB retrieval → Groq LLM (Llama 3.3 70B) → Response

---

### Emotion Detection

#### `POST /detect-emotion`

Analyze a webcam frame for facial emotions.

**Request Body:**

```json
{
  "image": "base64-encoded-image-string"
}
```

**Response:**

```json
{
  "emotion": "happy",
  "confidence": 0.91,
  "all_emotions": {
    "happy": 0.91,
    "neutral": 0.05,
    "sad": 0.02,
    "angry": 0.01,
    "fear": 0.01
  }
}
```

---

#### `POST /analyze-emotion-session`

Analyze a complete emotion detection session and return wellness insights.

**Request Body:**

```json
{
  "emotions": [
    { "emotion": "happy", "confidence": 0.9, "timestamp": 1700000000 }
  ],
  "duration": 300
}
```

**Response:**

```json
{
  "dominant_emotion": "happy",
  "wellness_score": 85,
  "recommendations": [
    { "icon": "🚀", "title": "Peak Performance", "description": "..." }
  ]
}
```

---

### Stress Analysis

#### `POST /analyze-stress`

Analyze stress indicators from emotion and behavioral data.

**Request Body:**

```json
{
  "emotions": [],
  "study_hours": 8,
  "sleep_hours": 6,
  "mood_entries": []
}
```

**Response:**

```json
{
  "stress_level": "moderate",
  "wellness_score": 65,
  "recommendations": []
}
```

<!-- TODO: Document exact request/response schemas from chatbot_api.py -->

---

## Error Responses

Both services return standard HTTP error codes:

| Code | Meaning |
|------|---------|
| `400` | Bad request — missing or invalid parameters |
| `404` | Route not found |
| `500` | Internal server error |

**Example error response:**

```json
{
  "detail": "Error message describing the issue"
}
```

---

## Frontend Service Modules

The frontend communicates with these APIs through service modules:

| Service File | Backend | Endpoints Used |
|-------------|---------|----------------|
| `extensionService.js` | Express | Extension analytics |
| `emotionDetectionService.js` | Express + FastAPI | Emotion save + detect |
| `aiMentorService.js` | FastAPI | `/chat` |
| `stressDetectionService.js` | FastAPI | `/analyze-stress` |

---

## Related Documentation

- [Architecture](README_ARCHITECTURE.md)
- [AI Service Details](README_AI.md)
- [Deployment](README_DEPLOYMENT.md)
