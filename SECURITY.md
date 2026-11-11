# Security policy

## Reporting a vulnerability

Please report privately through GitHub Security Advisories on this repository (or the maintainer's
contact address if listed in the app's Privacy Policy). Do not open a public issue and do not include real
user data. We aim to acknowledge reports within 3 working days and to fix confirmed issues quickly.

## Scope

In scope: the web app, Firestore and Storage rules, and the AI function in this repository.
Out of scope: social engineering, denial-of-service by volume, and third-party services (Firebase,
Cloudflare, Google).

## Our model

- The source code is public. Security never depends on code secrecy; every control must hold for an
  attacker who has read the code.
- Authorisation is enforced by Firestore/Storage rules and server-side checks, never by the UI.
- Secrets live only in server-side secret stores, never in the client or the repository.
- See `docs/ARCHITECTURE.md` for the implemented controls and the planned ones.

## Hardening checklist for self-hosters

1. Deploy `firestore.rules` and `storage.rules`.
2. Restrict your Firebase web API key to your domains.
3. Set a low billing budget with alerts if you use a paid plan.
4. Keep `.env.local` out of git (already ignored).
5. Run `npm audit` and keep dependencies updated.

## Browser protections

`firebase.json` sends `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS,
`Cross-Origin-Opener-Policy` and a Content-Security-Policy that enforces `object-src 'none'`,
`base-uri 'self'`, `frame-ancestors 'none'` and `form-action 'self'`. The full script/style/connect
policy is sent as `Content-Security-Policy-Report-Only` first, so it can be checked in the browser
console without breaking sign-in. After a clean pass, move its directives into the enforced header
(for CRA builds also set `INLINE_RUNTIME_CHUNK=false` so no inline script is needed).

## Data minimisation

- Firestore public reads are by exact document id only; listing `published` is denied.
- Writes are shape- and size-limited in `firestore.rules`; avatars are one fixed file per user (2 MB).
- GitHub import data stays in browser memory only (see `docs/GITHUB_IMPORT.md`).
