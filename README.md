# Ajaia Docs

A lightweight collaborative document editor, inspired by Google Docs. Built as a take-home assignment for the Full Stack Product Engineer role at Ajaia.

## Overview

Ajaia Docs lets registered users create rich-text documents, format them with a TipTap-powered editor, import existing TXT/Markdown files as new documents, and share documents with other users as either a **viewer** (read-only) or an **editor** (can edit, cannot delete or share). All formatting is stored as structured JSON, so documents reopen exactly as they were left, including after a browser refresh.

## Features

- Email/password registration and login (JWT-based)
- Create, rename, and delete documents
- Rich-text editing: bold, italic, underline, H1/H2, bullet and numbered lists
- Debounced autosave (~900ms after typing stops) with a visible Saving/Saved/Save failed indicator
- Import `.txt` and `.md` files (up to 2MB) directly into a new editable document
- Share documents with another registered user as viewer or editor
- Dashboard clearly separates "My Documents" from "Shared With Me"
- Backend-enforced authorization on every document and share endpoint
- Automated tests covering the core authorization workflow

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Redux Toolkit + RTK Query, TipTap

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer

**Testing:** Vitest, Supertest, mongodb-memory-server

**Infrastructure:** Docker, Docker Compose

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full breakdown. In short:

```
Browser (React/Vite) → REST API (Express) → Services/Controllers → MongoDB (Mongoose)
```

## Local Development

### Prerequisites

- Node.js 20+
- A running MongoDB instance (local install, Docker, or MongoDB Atlas)

### 1. Clone and install

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

```bash
# server/.env
cp server/.env.example server/.env
# then edit server/.env with your MongoDB URI and a JWT secret

# client/.env
cp client/.env.example client/.env
```

| Variable | Location | Description |
|---|---|---|
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | server | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | server | Frontend origin, used for CORS |
| `PORT` | server | API port (default `4000`) |
| `VITE_API_URL` | client | Base URL of the API, e.g. `http://localhost:4000/api` |

### 3. Start the backend

```bash
cd server
npm run dev
```

### 4. (Optional) Seed demo users

```bash
cd server
npm run seed
```

Creates two demo accounts for quick testing:

- `demo-owner@example.com` / `Password123!`
- `demo-editor@example.com` / `Password123!` (already has editor access to a demo document)

### 5. Start the frontend

```bash
cd client
npm run dev
```

Visit `http://localhost:5173`.

### 6. Run tests

```bash
cd server
npm test
```

> The test suite spins up an isolated in-memory MongoDB instance via `mongodb-memory-server`. On first run it downloads a small MongoDB binary, so an internet connection is required the first time you run `npm test`; the binary is cached afterward. No separate MongoDB installation or running instance is needed to run tests.

### 7. Run with Docker

```bash
docker compose up --build
```

This starts MongoDB, the API (port `4000`), and the frontend (port `5173`) together. Set a real `JWT_SECRET` in your shell or an `.env` file at the repo root before running in anything beyond local development.

## Supported Upload Types

- `.txt` and `.md` files only
- Maximum size: **2 MB**
- Unsupported extensions/MIME types and oversized files are rejected with a clear error message before a document is created

## Authentication

Lightweight JWT authentication: on register/login the server returns a signed JWT, which the client stores in `localStorage` and sends as `Authorization: Bearer <token>` on every request. On refresh, the client calls `GET /api/auth/me` to re-hydrate the current user from the stored token. Passwords are hashed with bcrypt and never returned by the API.

## Authorization

Every document has exactly one **owner** and zero or more shares, each with a **viewer** or **editor** permission:

| Action | Owner | Editor | Viewer |
|---|:---:|:---:|:---:|
| Read | ✅ | ✅ | ✅ |
| Edit content | ✅ | ✅ | ❌ |
| Rename | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| Share / manage shares | ✅ | ❌ | ❌ |

All of this is enforced **on the backend**, in a single reusable module (`server/src/services/documentAccessService.js`), never trusting frontend checks alone. A user with no relationship to a document gets a `404`, not a `403`, so document existence isn't leaked to unauthorized users.

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, receive a JWT |
| GET | `/api/auth/me` | Current authenticated user |
| POST | `/api/documents` | Create a document |
| GET | `/api/documents` | List owned + shared documents |
| GET | `/api/documents/:id` | Get one document (if authorized) |
| PATCH | `/api/documents/:id` | Update title/content (owner/editor) |
| PATCH | `/api/documents/:id/title` | Rename (owner/editor) |
| DELETE | `/api/documents/:id` | Delete (owner only) |
| POST | `/api/documents/import` | Upload a `.txt`/`.md` file, creates a new document |
| POST | `/api/documents/:id/shares` | Share with a user (owner only) |
| GET | `/api/documents/:id/shares` | List shares (owner only) |
| DELETE | `/api/documents/:id/shares/:userId` | Remove a share (owner only) |

## Testing

`server/tests/authorization.test.js` implements the exact workflow required by the assignment: User A creates a document, User B is blocked (`403`) from editing it, User A shares it with User B as an editor, User B's edit then succeeds and is verified to have actually persisted. A second scenario confirms a viewer can read but is blocked from editing, deleting, or sharing, and that an uninvolved user gets a `404`. `server/tests/auth.test.js` covers registration validation, duplicate email handling, and login failures.

Run with `npm test` from `server/`.

## Deployment

- **Backend:** deployable as a standard Node/Express service (Render, Railway, Fly.io, a VPS, etc.) using the provided `server/Dockerfile`, or directly with `npm start` behind a process manager. Point `MONGO_URI` at a hosted MongoDB (e.g. MongoDB Atlas) and set a strong `JWT_SECRET`.
- **Frontend:** the `client/Dockerfile` builds the Vite app and serves the static output via nginx (with SPA fallback routing configured). Any static host (Vercel, Netlify, S3+CloudFront) also works — just set `VITE_API_URL` to the deployed backend's URL at build time.
- **Database:** MongoDB Atlas is the simplest managed option for a project this size.

## Known Limitations

Intentionally out of scope for this take-home (see [SUBMISSION.md](./SUBMISSION.md) for the full list): real-time collaborative editing, comments, version history, Google OAuth, offline sync, full DOCX import, and an AI writing assistant. The Markdown importer covers headings, bold/italic, and lists — it is not a full Markdown/CommonMark implementation.
