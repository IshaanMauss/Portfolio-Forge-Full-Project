# Backend (Firebase Cloud Functions, Python)

Single HTTPS function `api_v2` that proxies AI text enhancement (Cloudflare Workers AI).

* `POST /api_v2/enhance-bio` `{ "bio": "..." }`
* `POST /api_v2/enhance-project` `{ "project_info": "..." }`

Requires a Firebase ID token (`Authorization: Bearer <token>`), enforces per-user and
global daily limits, and only allows the app's own origins. See `functions/.env.example`.

Secrets (never commit them):

```bash
firebase functions:secrets:set CF_API_KEY
firebase functions:secrets:set CF_ACCOUNT_ID
```

Deploy from the repository root: `firebase deploy --only functions`.
Python functions need the Firebase **Blaze** plan - set a budget alert in Google Cloud.
