# Portfolio Forge

Free, open-source portfolio and resume builder. Build several **goal-based versions** of your
portfolio (e.g. "Backend jobs", "Game dev"), share a public link per version, and download an
ATS-friendly PDF resume.

## Features

* Google sign-in, live preview, theme colours, two layouts
* Multiple portfolio versions, each with a private goal note
* Autosaved private drafts; **Save & Publish** writes a sanitized public copy
* Public portfolio `/p/<uid>/<version>` and web resume `/resume/<uid>/<version>`
* Text-based PDF (browser print) plus a quick image PDF fallback
* AI bio/project polish (Cloudflare Workers AI) with login + daily limits

## Free tools (no login, run in your browser)

* **ATS resume checker** (`/tools/ats`): estimates parser-friendliness and job-description keyword match
* **PDF editor** (`/tools/pdf`): merge, reorder, rotate, add text, sign. Files never leave your device
* **Import**: from a resume PDF or from public GitHub repositories (with evidence for each generated bullet)
* **3D constellation** of projects and skills on your public page (opt-in) with PNG export
* **Job tracker**, private to you, with CSV export
* Account page: export or permanently delete your data. Privacy and Terms pages included

> Multiple portfolio versions are implemented but paused in the UI (`src/utils/features.js`).

See `docs/ARCHITECTURE.md`, `docs/COMPLIANCE.md` and `SECURITY.md`.

## Architecture & security model

| Data | Location | Who can read | Who can write |
| --- | --- | --- | --- |
| Editable draft (all versions, address, hidden fields, version names/goals) | Firestore `portfolios/{uid}` | owner | owner |
| Public copy (hidden sections, address, version names stripped) | Firestore `published/{uid}` + `published/{uid}/versions/{id}` | anyone | owner |
| Profile pictures | Storage `profilePictures/{uid}/...` (image, < 2 MB) | anyone | owner |
| AI usage counters | Firestore `aiUsage/*` | nobody (server only) | Cloud Function |

Rules live in `firestore.rules` and `storage.rules`. The preview iframe is sandboxed and all
user text is escaped. Version ids in public URLs are guessable-ish: treat published versions
as public.

## Local setup

Prerequisites: Node 18+, Python 3.12, Firebase CLI.

```bash
git clone https://github.com/IshaanMauss/Portfolio-Forge-Full-Project.git
cd Portfolio-Forge-Full-Project/portfolio-forge
cp .env.example .env.local      # fill in your Firebase web app config
npm install
npm run dev                      # http://localhost:3000 (Vite)
```

Other commands: `npm test` (Vitest), `npm run build` (Vite build, then static SEO pages, sitemap and robots.txt in `build/`). Security-rules tests: `cd rules-tests && npm install && npm test` (needs Java 21).

AI backend (optional locally): set the secrets and run `firebase emulators:start` from the repo root.

## Deploy

```bash
cd portfolio-forge && npm ci && npm run build && cd ..
firebase deploy                   # hosting, functions, firestore + storage rules
gsutil cors set portfolio-forge/cors.json gs://<your-bucket>   # one-time, for image CORS
```

In Google Cloud, restrict the Firebase web API key to your domains (HTTP referrers) and set a
billing budget alert.

## Contributing / security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). License: MIT.
