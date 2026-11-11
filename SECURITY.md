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
