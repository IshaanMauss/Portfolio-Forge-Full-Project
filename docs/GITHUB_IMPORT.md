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

## Later (not built)

Private repositories (read-only GitHub App with per-repository installation), commit-level contribution
analysis, AI polishing through the Worker with user consent, README quality coach.
