# GitHub import

Turns real repositories into evidence-backed portfolio projects. MVP scope: **public repositories only**,
no sign-in, no tokens.

## What it reads (per selected repository, max 5)

1. Repository metadata from `GET /users/{u}/repos` (name, description, topics, stars, homepage, licence flag).
2. README (`/readme`), capped at 40 KB.
3. Root file listing (`/contents`) to spot Dockerfile, `.github`, tests, manifests.
4. `package.json` / `requirements.txt` when present, and `/languages`.

That is about five unauthenticated GitHub API calls per repository (limit: 60 per hour per network).

## What it never does

- Run code, install packages, or deploy anything.
- Read `.env`, source files, or private repositories.
- Follow links found in a README.
- Send repository text to an AI model. Everything is deterministic; README text is stripped to plain
  text and treated as data only.
- Publish anything: you review, edit and press **Add to my projects** yourself.

## How claims are produced

Each draft bullet is one of two kinds, and the UI says which:

- **Repository evidence**: restates a detected fact ("using React, Express and MongoDB") and lists the
  files or statistics that support it.
- **Your words**: text you typed in the five confirmation questions (what you built, hardest problem,
  measurable outcome). We never invent users, revenue or performance numbers.

The verb depends on your answer to "Your role" (Built / Developed / Contributed to). Forks and team
projects show a lower **authorship** level and a note to describe your own contribution.

## Data handling

- Repository text is kept only in a JavaScript `Map` in the open tab and cleared when the import panel
  closes. It is never written to localStorage, Firestore, Storage or our Worker.
- Requests use `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, a 12 s timeout, and a 60 KB cap
  per file. Repository names are validated against a strict pattern before building any API path.
- Homepage and repository links are accepted only if they are plain `http(s)` URLs; `javascript:` and
  similar are dropped. Public pages additionally pass every link through `safeUrl`.
- A hostile README cannot take control of the app: it is stripped to plain text, rendered by React
  (escaped), and never evaluated.
- Someone else's repository: only public data is read, only the username you type is used, and nothing
  is shared back to GitHub or the repository owner.

## Later (not built)

Private repositories (read-only GitHub App with per-repository installation), commit-level contribution
analysis, AI polishing through the Worker with user consent, README quality coach.
