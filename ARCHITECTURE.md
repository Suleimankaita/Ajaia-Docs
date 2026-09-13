# Architecture

## High-level flow

```
Browser
  │  (React + Vite SPA, Redux Toolkit + RTK Query for data fetching/caching)
  ▼
REST API  (Express, JSON over HTTPS)
  │
  ▼
Routes → Controllers → Services → Mongoose Models
  │
  ▼
MongoDB
```

The app is a conventional layered REST architecture, chosen specifically because it's the simplest reliable approach for a 4-6 hour scope with a real authorization model — no GraphQL, no WebSockets, no separate microservices.

- **Routes** (`server/src/routes/`) only wire URLs to middleware/controllers. No business logic lives here.
- **Controllers** (`server/src/controllers/`) parse the request, call services, and shape the response. They're intentionally thin.
- **Services** (`server/src/services/documentAccessService.js`) hold the one piece of logic that matters most for correctness: "does this user have permission to do X to this document." Every controller that touches a document goes through this module instead of re-implementing role checks inline.
- **Models** (`server/src/models/`) are plain Mongoose schemas with the indexes needed for the app's actual query patterns.

## Authentication

Lightweight JWT auth: `POST /api/auth/login` and `/register` return a signed token (`jsonwebtoken`, secret from `JWT_SECRET`). The client stores it in `localStorage` and attaches it as `Authorization: Bearer <token>` via an RTK Query `prepareHeaders` hook, so every request is authenticated without repeating that logic per-call. `requireAuth` middleware verifies the token and loads the user once per request, attaching it to `req.user`.

**Trade-off:** JWTs in `localStorage` are simple and stateless (no session store needed) but are vulnerable to XSS exfiltration in a way an httpOnly cookie wouldn't be. For a take-home of this scope, the simplicity was judged worth it; a production system would likely move to httpOnly cookies with CSRF protection.

## Authorization

Documents have exactly one `owner` (a `User` reference) and any number of `DocumentShare` records, each pairing a `user` with a `permission` (`viewer` | `editor`). `getDocumentWithRole(documentId, userId)` is the single function that answers "what can this user do here" — it returns the document plus a computed role (`owner` | `editor` | `viewer`), and throws a `404` (not `403`) if the user has no relationship to the document at all, so we don't leak the existence of documents the user can't see. From there, small `assertCanEdit` / `assertCanRename` / `assertIsOwner` helpers turn a role into a pass/fail check, called explicitly in every controller that needs it. This was chosen over scattering `if (doc.owner !== req.user.id)` checks across controllers, which is exactly the kind of duplication that causes real security bugs when one code path is missed.

## Document persistence & TipTap JSON

TipTap's internal representation is a ProseMirror JSON document (`{ type: "doc", content: [...] }`). The `Document.content` field is stored as `mongoose.Schema.Types.Mixed` holding that JSON directly, rather than storing rendered HTML. **Why:** HTML is lossy and hard to reliably re-parse back into an editable TipTap state; JSON is TipTap's native format, so saving and loading are symmetric — `editor.getJSON()` on save, passed straight back into `useEditor({ content })` on load. This is what makes formatting survive a save → close → reopen → refresh cycle exactly as documented.

## File import workflow

`POST /api/documents/import` accepts a single file via Multer (`memoryStorage`, so nothing touches disk), validated by extension, MIME type, and a 2MB size cap before the body is even read. `.txt` files become one paragraph node per non-empty line. `.md` files go through a small dependency-free converter (`server/src/utils/fileToTiptap.js`) that recognizes `#`/`##` headings, `-`/`*` bullets, numbered lists, and `**bold**`/`*italic*` inline spans — deliberately not a full CommonMark implementation, since the assignment explicitly scopes that out. The result is inserted as a new `Document` owned by the uploader and the client navigates straight into the editor.

## Sharing model

A `DocumentShare` is a join record between a `Document` and a `User`, with a unique compound index on `(document, user)` so the database itself prevents duplicate shares — the API layer additionally checks for self-sharing and nonexistent target users before hitting that constraint, so failures return a clear `400`/`404` rather than a raw `409` from a duplicate-key error. Sharing again with an existing user updates their permission in place instead of erroring, matching the assignment's "update the existing permission in a controlled way" option.

## Autosave

The editor debounces `onUpdate` events (900ms) before calling `PATCH /api/documents/:id`, rather than saving on every keystroke or requiring an explicit save button as the only path. A small `useDebouncedCallback` hook (plain `setTimeout`, no external library) drives this, and a status indicator in the header cycles through `Saving… → Saved` (or `Save failed` on a rejected request) so the state of the document is always visible.

## Error handling

A single Express error-handling middleware (`server/src/middleware/errorHandler.js`) is the only place that formats error responses. Controllers `throw new ApiError(statusCode, message)` for expected failures (validation, authorization, not-found, conflict); anything else — a Mongoose `ValidationError`, a duplicate-key `11000`, a bad `ObjectId` `CastError`, a Multer file-size error, or a genuinely unexpected exception — is normalized into a safe `{ message }` response with an appropriate status, and unexpected errors are logged server-side but never expose stack traces or internals to the client.

## Testing strategy

Backend tests (Vitest + Supertest) run against a real, isolated MongoDB instance provided by `mongodb-memory-server`, rather than mocking Mongoose. This exercises actual index constraints and Mongoose behavior (e.g. the unique share index, cast errors) at the cost of a slightly slower test boot, which was judged the more reliable trade-off for an authorization-focused test suite. The primary test walks through the exact scenario from the assignment brief end-to-end: create → forbidden edit → share → permitted edit → verify persisted change; a second test covers the viewer-permission boundary and the "no access at all" case.

## Deployment

The backend is a standard stateless Express service — deployable anywhere Node runs, containerized via `server/Dockerfile`. The frontend is a static Vite build served by nginx (`client/Dockerfile`), with an nginx SPA fallback so client-side routes survive a hard refresh. `docker-compose.yml` wires both together with a local MongoDB container for one-command local development.

## Why MongoDB

The data model here is naturally document-shaped: a `Document`'s `content` is an arbitrarily nested TipTap JSON tree with no fixed schema, which maps awkwardly onto relational columns but directly onto a MongoDB document. Relationships that do need to be normalized — `owner`, and the `DocumentShare` join between documents and users — are still simple, low-cardinality references that Mongoose's `populate` handles well without needing SQL joins. Given the scope and timeline, MongoDB avoided both premature schema rigidity and the overhead of a full relational migration setup.
