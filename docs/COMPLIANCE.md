# Compliance notes for maintainers

This is an engineering checklist, **not legal advice**. Have a lawyer or CA review it before you
rely on it, especially before enabling ads or taking payments.

## Privacy (India DPDP Act 2023, GDPR-style rights)

- [x] Plain-language Privacy Policy (`/privacy`) matching the real data flows.
- [x] Data export (`/account` -> Download my data) and permanent deletion (`/account` -> Delete).
- [x] Adults only (18+), so no verifiable parental consent flow is needed.
- [ ] Set `REACT_APP_CONTACT_EMAIL` so the policy shows a grievance/contact address.
- [ ] Re-read the policy whenever you add analytics, ads, or a new processor.

## Ads (Google AdSense or others)

- Ads are off: `FEATURES.ads = false` in `src/utils/features.js`. The consent banner and the
  consent store (`src/utils/consent.js`) are ready and only activate when it is true.
- Show ads only on content/tool pages with original, useful content. Not on the editor, login screen,
  empty pages, or user-published portfolios (you would be responsible for user content).
- Load ad scripts only when `hasAdConsent()` is true.
- For visitors in the EEA/UK/Switzerland, Google requires a Google-certified consent platform (CMP) for
  personalised ads. Check Google's current requirements and plug a CMP in before enabling ads there.
- Publish `ads.txt` at the site root after approval.
- Update the Privacy Policy's advertising section with the actual partners.

## Payments from AdSense (India)

- Individual account with PAN and a KYC-complete Indian bank account in the same name is enough to start.
- Submit the US tax form (W-8BEN) with your PAN to get the treaty withholding rate.
- Income is taxable; keep records and confirm GST/ITR treatment with a CA.

## Abuse handling

- Published pages are user content. Keep a way to take pages down (Firestore console: delete
  `published/{uid}`) and respond to reports within a stated time.
