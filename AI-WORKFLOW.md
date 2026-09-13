# AI Workflow

This document is an honest account of how AI (Claude) was used while building Ajaia Docs.

## How AI was used

AI was used as an engineering assistant throughout, for:

- **Implementation planning** — breaking the assignment brief into ordered phases (setup → auth → document API → sharing/authorization → frontend auth → dashboard → editor → autosave → import → tests → Docker → docs), so the riskiest and highest-priority pieces (auth, persistence, authorization) were built and verified before UI polish.
- **Boilerplate generation** — Express app wiring, Mongoose schemas, Redux Toolkit/RTK Query setup, Vite/Tailwind config, and repetitive CRUD controller shapes.
- **Debugging** — for example, fixing a Mongoose duplicate-index warning caused by declaring `unique: true` on a field and separately calling `schema.index()` on it, and resolving a stray shell brace-expansion issue while scaffolding directories.
- **API design ideas** — the shape of `getDocumentWithRole()` as a single reusable authorization function, rather than duplicating owner/editor/viewer checks in every controller.
- **Edge-case identification** — returning `404` instead of `403` for a user with no relationship to a document (so document existence isn't leaked); handling the "share already exists" case by updating the permission rather than erroring; guarding against self-sharing.
- **Documentation** — this file, the README, and ARCHITECTURE.md.
- **Code review** — re-reading generated controllers against the assignment's authorization table before considering them done.

Generated code was reviewed and, where needed, corrected rather than accepted as-is — for instance, the initial User model had a redundant index declaration that was caught and removed, and the file-upload MIME-type allowlist was adjusted after checking what real browsers actually send for `.md` files.

## Areas that required human verification

The following areas were treated as too important to trust to AI output without independent verification:

- **Authentication** — confirming passwords are hashed with bcrypt before storage and never returned in any API response (verified via the schema's `toJSON` transform and by inspecting actual response bodies in tests).
- **Authorization** — the owner/editor/viewer permission matrix was checked line-by-line against the assignment's explicit table, and exercised with automated tests rather than just reading the code and assuming it was correct.
- **Document ownership** — verifying that `owner` is set from the authenticated request user server-side, never accepted from the client body.
- **Share permissions** — confirming the unique `(document, user)` index actually prevents duplicate shares, and that only the owner can create, list, or remove shares.
- **File validation** — confirming the 2MB limit and extension/MIME allowlist are enforced server-side (not just hidden via the `accept` attribute on the frontend file input, which a user could bypass).
- **Database operations** — checking that deleting a document also cleans up its `DocumentShare` records, so shares don't silently reference a deleted document.
- **Autosave** — confirming the debounce actually batches keystrokes into a single request instead of firing on every character.
- **API error handling** — verifying that unexpected errors are logged server-side but return a generic message to the client, with no stack traces or Mongo internals exposed.
- **Tests** — reading the two authorization test files to confirm they assert on real response bodies and database state (e.g. re-fetching the document after User B's edit to confirm the title actually changed), not just HTTP status codes.

## How the application was verified

- **Manual end-to-end testing**: registering two accounts, creating a document, sharing it, and confirming the dashboard correctly separates "My Documents" from "Shared With Me".
- **Automated API tests**: `npm test` runs the full authorization workflow (blocked edit → share → permitted edit → verified persisted change) plus a viewer-permission scenario and basic auth validation, against an isolated in-memory MongoDB instance.
- **Refresh/persistence testing**: confirming a formatted document (headings, bold, lists) reopens with identical formatting after a hard browser refresh, since content is round-tripped as TipTap JSON rather than HTML.
- **Permission testing**: manually confirming a viewer account cannot edit, rename, delete, or share a document, and that the UI disables editing (with the backend as the actual enforcement point, not the UI).
- **Upload validation**: testing that a `.txt` and a `.md` file both import correctly, and that an unsupported extension and an oversized file are both rejected with a clear message rather than a generic 500.
- **Browser testing**: checking the dashboard and editor render usably at desktop, tablet, and mobile widths.

## What AI did not do

AI did not generate the whole application and get accepted blindly — every file was reviewed, and several were corrected during development (see above). No claim is made that every suggestion was used verbatim; several early suggestions (e.g. a heavier Markdown parsing library, and an initial multer version with known vulnerabilities) were replaced with simpler or safer alternatives during review.
