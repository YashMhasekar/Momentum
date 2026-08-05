# Database

Momentum uses **Firebase Firestore** as its primary database. This document describes the data model, collections, indexes, and security considerations.

---

## Overview

| Property | Value |
|----------|-------|
| Database type | NoSQL (document-based) |
| Provider | Firebase Firestore |
| Client SDK | Firebase JS SDK v11 (frontend) |
| Admin SDK | Firebase Admin SDK (Express backend) |
| Real-time | Yes — Firestore listeners for live updates |
| Offline | Persistent local cache enabled in frontend |

---

## Collections

<!-- TODO: Verify and expand collection schemas against actual Firestore data -->

### `users`

Stores user profiles and role information.

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Firebase Auth UID (document ID) |
| `email` | string | User email address |
| `displayName` | string | Full name |
| `role` | string | `student` or `college_admin` |
| `department` | string | Academic department |
| `momentumScore` | number | Calculated momentum score |
| `createdAt` | timestamp | Account creation date |
| `photoURL` | string | Profile photo URL |

### `tasks`

Personal and assigned tasks for students.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner UID |
| `title` | string | Task title |
| `description` | string | Task details |
| `status` | string | `pending`, `in_progress`, `completed` |
| `priority` | string | `low`, `medium`, `high` |
| `dueDate` | timestamp | Deadline |
| `assignedBy` | string | Admin UID (if assigned) |
| `createdAt` | timestamp | Creation date |

<!-- TODO: Document collaborative tasks subcollection structure -->

### `habits`

Daily habit tracking entries.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner UID |
| `name` | string | Habit name |
| `streak` | number | Current streak count |
| `completedDates` | array | Dates habit was completed |
| `createdAt` | timestamp | Creation date |

### `moods`

Manual mood log entries.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner UID |
| `mood` | string | Mood label |
| `note` | string | Optional note |
| `timestamp` | timestamp | Log time |

### `emotions`

Emotion detection session records (written by Express backend).

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner UID |
| `sessionId` | string | Unique session identifier |
| `emotions` | array | Detected emotions with timestamps |
| `dominantEmotion` | string | Most frequent emotion in session |
| `wellnessScore` | number | Calculated wellness score (0–100) |
| `duration` | number | Session duration in seconds |
| `createdAt` | timestamp | Session start time |

### `leaderboard`

Aggregated momentum scores for ranking.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Student UID |
| `displayName` | string | Student name |
| `momentumScore` | number | Current score |
| `rank` | number | Current rank |
| `department` | string | Department filter |
| `updatedAt` | timestamp | Last score update |

### `extensionData`

Browser extension activity tracking.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner UID |
| `date` | string | Date string (YYYY-MM-DD) |
| `studyTime` | number | Study time in seconds |
| `distractionTime` | number | Distraction time in seconds |
| `sites` | array | Visited site breakdown |
| `productivityRatio` | number | Study / total ratio (0–100) |

### `supportRooms`

Anonymous peer support chat rooms.

| Field | Type | Description |
|-------|------|-------------|
| `roomId` | string | Room identifier |
| `topic` | string | Support topic category |
| `participants` | array | Anonymous participant IDs |
| `messages` | subcollection | Chat messages |
| `createdAt` | timestamp | Room creation time |
| `isActive` | boolean | Room status |

### `calendarEvents`

Calendar events with optional task linking.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner UID |
| `title` | string | Event title |
| `start` | timestamp | Start time |
| `end` | timestamp | End time |
| `category` | string | Event category |
| `priority` | string | Priority level |
| `linkedTaskId` | string | Optional linked task |
| `googleEventId` | string | Google Calendar sync ID |

<!-- TODO: Document additional collections (planner, focus tests, counselor bookings) -->

---

## Indexes

Firestore requires composite indexes for complex queries. Create these in the Firebase Console when prompted by query errors.

<!-- TODO: List all required composite indexes with exact field combinations -->

| Collection | Fields | Query Type |
|------------|--------|------------|
| `tasks` | `userId`, `status`, `dueDate` | Filter + sort |
| `emotions` | `userId`, `createdAt` | History queries |
| `leaderboard` | `department`, `momentumScore` | Ranked queries |
| `extensionData` | `userId`, `date` | Daily analytics |

**Creating indexes:**

1. Run the query in the app
2. Check the browser console for a Firebase index creation link
3. Click the link and create the index in Firebase Console
4. Wait 2–5 minutes for the index to build

---

## Security Rules

<!-- TODO: Document and paste production Firestore security rules -->

Example rule structure (development reference only):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // TODO: Add rules for tasks, habits, moods, emotions, etc.
    // TODO: Add admin role checks for college_admin operations
  }
}
```

**Production requirements:**

- Users can only read/write their own data
- College admins can read aggregated student data within their department
- Support room messages are write-only for participants, read by moderators
- No public read access to any collection

---

## Firebase Admin (Backend)

The Express backend uses the Firebase Admin SDK with a service account key.

```
backend/server/serviceAccountKey.json  ← local development only, gitignored
backend/server/serviceAccountKey.json.example  ← template (safe to commit)
```

**Production:** Inject the service account JSON as an environment secret rather than a file.

Admin operations performed by the backend:

- Cross-user analytics aggregation
- Emotion session persistence
- Admin dashboard data queries
- Leaderboard score updates

---

## Data Retention

<!-- TODO: Define data retention policies -->

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| User profiles | Until account deletion | GDPR compliance |
| Emotion sessions | <!-- TODO --> | Wellness data sensitivity |
| Extension analytics | <!-- TODO --> | Productivity tracking |
| Support messages | <!-- TODO --> | Moderation requirements |

---

## Related Documentation

- [Architecture](README_ARCHITECTURE.md)
- [API Reference](README_API.md)
- [Security Policy](../SECURITY.md)
