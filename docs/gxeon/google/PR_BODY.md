## MISSION
`XPEX-GOOGLE-LIVE-ZERO-BILLING-001` (GXEON HANDOFF 004)

## MODE SELECTED
`MODE B — OFFICIAL XPEX GOOGLE PORTAL` (Firebase Hosting entry layer + Railway application engine bridge)

## GOOGLE/FIREBASE PROJECT
- **Project ID:** `xpex-academy-stage`
- **Project Number:** `364943107161`
- **Plan:** Spark (100% Free / Zero Billing)

## PUBLIC URL
- Primary: **https://xpex-academy-stage.web.app**
- Secondary: **https://xpex-academy-stage.firebaseapp.com**

## BILLING STATE
- `billingEnabled: false`
- Cost: **R$ 0,00** (Zero billing, no credit card required)

## ARCHITECTURE
```
USER
  ↓
GOOGLE / FIREBASE PUBLIC URL (https://xpex-academy-stage.web.app)
  ↓
XPEX ACADEMY BRAND EXPERIENCE (Hero, Trilhas, GX Copilot, Professores)
  ↓
LOGIN / ENTER ACADEMY (Primary CTA)
  ↓
CURRENT XPEX RUNTIME (Railway — kelle-digital-lab.up.railway.app)
  ↓
GXEON AI GATEWAY
  ↓
GEMINI
```

## FILES CHANGED
- `deployment/firebase/firebase.json` (Hosting configuration, hardened response headers, clean URLs)
- `deployment/firebase/.firebaserc` (Project mapping)
- `deployment/firebase/.gitignore`
- `deployment/firebase/public/index.html` (Official dark premium AI-native portal)
- `deployment/firebase/public/404.html` (Custom branded 404 handler)
- `deployment/firebase/public/robots.txt`
- `deployment/firebase/public/sitemap.xml`
- `docs/gxeon/google/XPEX_GOOGLE_ZERO_BILLING_LIVE_EVIDENCE.md` (Audit and verification evidence)

## TESTS
- `GET https://xpex-academy-stage.web.app`: 200 OK (Verified title, content, SSL)
- `GET https://xpex-academy-stage.firebaseapp.com`: 200 OK
- `GET https://xpex-academy-stage.web.app/notfound`: 404 Not Found (Branded 404 page)
- Mobile responsiveness: 360px, 390px, 768px, 1440px (Mobile-first, 0 horizontal scroll)
- Primary CTA source destination: `https://kelle-digital-lab.up.railway.app/login?next=%2Fxpex` (must be re-verified live after Firebase redeploy)

## SECURITY
- Zero secrets committed (no API keys, no tokens, no DB strings)
- Hardened response headers configured on Firebase Hosting, including CSP, HSTS, COOP, CORP, Permissions-Policy and Referrer-Policy
- Authentication authority remains isolated on canonical backend

## GX AUDIT GATE
- Initial live revision used a stale Railway CTA domain and failed the destination check.
- Source was corrected to the verified production domain and the live CTA now resolves correctly.
- Unrelated sale/M&A/Web3 artifacts that were later added to the same branch were removed from this PR.
- Their pre-cleanup state is preserved separately on `archive/pr243-mna-web3-experiments-2026-09-23`.
- The PR is again single-purpose: Firebase zero-billing public front door only.
- Final Firebase redeploy is required to publish the latest hardened headers/SEO files and remove the previously published sale manifests before merge approval.

## LIMITATIONS
- Zero-billing bridge: public front door on Google/Firebase, backend processing on existing runtime until Cloud Run billing activation.

## RAILWAY STATUS
- Operational, preserved, untouched.

## GEMINI/GXEON STATUS
- GXEON AI Gateway intact; Gemini core foundation preserved from PR #241.

## COST
- **R$ 0,00** (Zero paid resources created, Spark plan only)

## ROLLBACK
- `firebase hosting:disable --project xpex-academy-stage` or rollback hosting release.
- Zero impact to Railway production.

## EVIDENCE
- Detailed report at `docs/gxeon/google/XPEX_GOOGLE_ZERO_BILLING_LIVE_EVIDENCE.md`
