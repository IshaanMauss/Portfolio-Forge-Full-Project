# Portfolio Forge edge Worker

One small Cloudflare Worker in front of the app. Free tier, no credit card.

| Job | Route | Why |
| --- | --- | --- |
| Link previews | `GET /p/:uid/:version?`, `/resume/:uid/:version?` | A single-page app cannot show a rich card on WhatsApp/LinkedIn. The Worker fetches the app's HTML and injects Open Graph tags from the **published** portfolio only. |
| Security headers | every HTML response | `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. |
| AI gateway | `POST /api/enhance-bio`, `/api/enhance-project` | Verifies the Firebase ID token, applies per-user and global daily limits, calls Workers AI. No secret key is needed (the AI is a binding). |
| Pass-through | everything else | Proxies to the Firebase Hosting origin. |

## Deploy (about 10 minutes)

```bash
cd portfolio-forge-worker
npm install
npx wrangler login
npx wrangler kv namespace create LIMITS     # paste the id into wrangler.toml
npx wrangler deploy
```

Then in the React app set `REACT_APP_AI_URL=https://<worker>.workers.dev/api`, rebuild and redeploy
Hosting. The AI buttons stay hidden until that variable exists.

For link previews to reach real visitors, put your **custom domain** on Cloudflare and route it to this
Worker (the Worker proxies to Firebase Hosting). Shared links must use that domain.

## Safety notes

- Route ids are validated (`^[A-Za-z0-9_-]{1,128}$`) before they touch a Firestore URL.
- Preview text comes from Firestore and is HTML-escaped; only `https://` images are used.
- Firestore reads use a field mask (4 fields) and are cached 10 minutes to keep egress and reads tiny.
- Quotas live in KV, which is eventually consistent: treat them as a cost guard, not an exact meter. The
  global cap bounds the worst case. For exact counting, switch to a Durable Object.
- CORS allows only origins listed in `ALLOWED_ORIGINS`.

## Tests

`npm test` runs Node's built-in test runner (token verification with generated keys, quotas, escaping,
route parsing, input validation). No dependencies needed.
