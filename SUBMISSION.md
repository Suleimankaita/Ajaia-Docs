# Submission

**Live product URL:** [ADD DEPLOYED URL]

**Video walkthrough:** [ADD VIDEO URL]

**Source code:** [ADD GITHUB URL]

## Test accounts

**Account 1 (owner):**
email: demo-owner@example.com
password: Password123!

**Account 2 (editor, has shared access to a demo document):**
email: demo-editor@example.com
password: Password123!

_(Created by running `npm run seed` in `server/`. Replace with your own deployed accounts if the seed script wasn't run against your production database.)_

## Implemented features

- Authentication (register, login, JWT, persistent session across refresh)
- Document creation, rename, delete
- Rich-text editing (bold, italic, underline, H1, H2, bullet list, numbered list)
- Persistence of formatting via TipTap JSON, surviving save/reopen/refresh
- File import (.txt and .md, up to 2MB) into a new editable document
- Sharing with another registered user, as viewer or editor
- Viewer/editor permission enforcement, on the backend
- Dashboard separating "My Documents" from "Shared With Me"
- Automated backend tests covering the core authorization workflow
- Docker + Docker Compose setup for local development
- README, architecture, and AI-workflow documentation

## Deliberate scope cuts

- Real-time collaborative editing
- Comments
- Version history
- Google OAuth
- Offline editing / offline sync
- Advanced/complex RBAC
- Full DOCX conversion
- AI writing assistant

These were explicitly out of scope for this assignment and are called out here rather than silently missing.

## Next 2-4 hours if more time were available

- Add optimistic UI updates for document title renames instead of waiting for the request to resolve
- Add pagination to the dashboard for users with a large number of documents
- Expand the Markdown importer to handle nested lists and links
- Add rate limiting to the auth endpoints
- Add end-to-end (browser-level) tests with Playwright, complementing the existing API-level tests
- Move JWTs from `localStorage` to httpOnly cookies with CSRF protection for stronger XSS resistance

## Known limitations

- The Markdown importer supports headings, bold/italic, and lists — it is not a full CommonMark-compliant parser (no tables, code blocks, links, or nested lists)
- No pagination on the document list; all owned/shared documents are returned in a single response
- No real-time updates — if a document is edited by two people at once, the last save wins (no conflict resolution)
- No password reset flow
- File import supports `.txt` and `.md` only, as specified in the assignment
