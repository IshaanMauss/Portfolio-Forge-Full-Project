# Contributing

1. Fork, create a branch, make your change.
2. `cd portfolio-forge && npm ci && npm test -- --watchAll=false && npm run build`
3. Keep user-supplied values escaped (`src/utils/escape.js`) and anything private out of `published/*` (`src/utils/sanitize.js`).
4. Open a pull request describing what and why.
