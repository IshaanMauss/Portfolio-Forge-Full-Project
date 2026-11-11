# Architecture

Portfolio Forge is a client-heavy single-page app (React 19, React Router 7) on Firebase.
This document states what is **implemented**, and separately what is **planned**.

## System overview

```
Browser (SPA)
 ├─ Editor / public pages ── Firebase Auth (Google) ── Firestore (rules-enforced) ── Storage (rules-enforced)
 ├─ Tools: ATS checker, PDF editor ── run 100% in the browser (pdf.js, pdf-lib). No upload, no server.
 └─ AI assist (optional) ── Cloud Function / Worker ── Cloudflare Workers AI
```

## Data model and trust boundaries (implemented)

| Data | Location | Read | Write |
| --- | --- | --- | --- |
| Editable draft | `portfolios/{uid}` | owner | owner |
| Public copy (sanitised) | `published/{uid}`, `published/{uid}/versions/{id}` | anyone | owner |
| Profile picture | Storage `profilePictures/{uid}/*` (image, < 2 MB) | anyone | owner |
| AI counters | `aiUsage/*` | nobody | server only |

Design rule: **the browser is untrusted.** Authorisation lives in `firestore.rules` and `storage.rules`,
not in the UI. A draft never becomes public unless the owner publishes; `sanitizeForPublic` strips
hidden sections, the address and version names before the public copy is written.

## Security controls (implemented)

- Owner-only rules for private data; deny-by-default for everything else.
- All user text is escaped (`escapeHtml`), URLs allow-listed (`safeUrl`), colours validated (`safeColor`).
- Live preview runs in a sandboxed iframe (`sandbox=""`): no scripts, no same-origin access.
- PDF parsing uses `isEvalSupported:false` (blocks the known pdf.js font-eval exploit path).
- AI endpoint: Firebase ID token required, per-user and global daily quotas in Firestore transactions,
  CORS allow-list, secrets via Secret Manager, `max_instances` cap.
- Uploads: type and size validated in the client **and** enforced in Storage rules.
- Secrets never ship to the client; Firebase web config is public by design and restricted by rules
  and API-key referrer restrictions.

Security does **not** rely on hiding the source. The repository is public; every control above must
hold for an attacker who has read all the code.

## Performance and cost design (implemented)

- Route-level code splitting: the 3D hero (three.js), PDF engines and legal pages are lazy chunks, so the
  editor's first load stays small. The PDF worker (~1 MB) loads only on the PDF tools.
- Fonts are self-hosted variable fonts (no third-party font request for the app shell).
- The 3D scene pauses when off-screen or the tab is hidden, caps pixel ratio, and respects
  `prefers-reduced-motion`.
- Autosave is debounced (3 s) and only writes when the data changed; publishing is one batched write.
- Heavy work (ATS parsing, PDF editing) is client-side: zero server cost and zero egress per use.

## Planned (not implemented yet)

- Firebase App Check to reject non-app clients.
- HTTP security headers in `firebase.json` (CSP, HSTS, Referrer-Policy, Permissions-Policy).
- Server-rendered public pages (Next.js) for rich link previews and `/u/username` URLs.
- Caching headers and CDN rules for static assets and published pages.
- Staging Firebase project and automated rules tests with the emulator.
- Multiple portfolio versions per account (code exists; UI paused behind `FEATURES.multiVersion`).

## Repository map

- `portfolio-forge/` the React app. `src/utils` holds the tested pure logic (normalise, sanitise, escape,
  ATS scoring, PDF export).
- `portfolio-forge-backend/` the optional AI function.
- `firestore.rules`, `storage.rules`, `firebase.json` deployment config.
