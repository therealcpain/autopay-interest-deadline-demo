# Autopay Interest Deadline

**Paste today’s date + whether you’re already on servicer autopay → one shareable card:**  
giant **days-left-to-Sep-30** badge · **already-on-autopay vs enroll-via-servicer** chip · **Jun 30 2028** benefit-end footnote · StudentAid.gov / servicer pointer.

Brand on the surface: **Autopay Interest Deadline** only.

Not a Loan Simulator. Not SAVE / repayment-plan advice. **Not financial advice** and **not** a determination that you are eligible. User-pasted status flags only — zero servicer / NSLDS scrape.

## Hypothesis

Borrowers heard “1% off” but miss the **Sep 30 2026 enroll-by** cutoff, confuse StudentAid.gov with servicer autopay, or assume already-enrolled status incorrectly. Flip that deadline anxiety into a **calendar-honest share card** from their view date + autopay flag — without recommending a plan or inventing savings. Success = “did you enroll yet?” shares in the final two weeks before Sep 30.

## How to test (local)

```bash
cd kb/mde/autopay-interest-deadline
npm run build          # copies assets → dist/
npm run verify         # countdown + chip + seed checks
# either open the file:
open index.html        # or dist/index.html
# or serve:
npm start              # http://localhost:4224
```

Manual checklist:

1. Open the page → click **Not on autopay · 17 days left** → giant **17 days left** badge, enroll-via-servicer chip, Jun 30 2028 footnote, ED / StudentAid.gov footer.
2. Click **Already on autopay · no extra action** → already-on chip (no extra action for the temporary 1%).
3. Click **Unsure · check servicer** → check-servicer chip · StudentAid.gov ≠ autopay toggle.
4. Click **Last day · Sep 30** → TODAY / last-day badge · enroll by 11:59 p.m. ET.
5. Click **Window closed · Oct 1** → CLOSED badge · no invented late-enroll path.
6. Paste your own view date + autopay status → **Show deadline card**.
7. Missing view date → honest status (no invented days left).
8. **Copy summary** → clipboard has countdown + chip + ED cites.
9. **Share link** → `#p=` restores the card.
10. **Export PNG** → dark deadline card with days-left badge + status chip + **financial disclaimer** on the face.
11. Surface brand is **Autopay Interest Deadline** only (no Conglomerate / personal names).

### GitHub Pages

This folder is static-ready. Point Pages at `/` of a dedicated repo (or `/docs` after copying `dist/`), with `index.html` at the site root. Relative paths (`styles.css`, `app.js`) work on project pages.

```bash
npm run build   # optional artifact in dist/
```

Do **not** create the public repo or post from this build step — Steward handles Pages + distro. Distro stays product-linked only (e.g. r/StudentLoans, r/personalfinance, caregiver shares in the Sep 15–30 window). **No sock accounts.** No fake servicer DMs.

## Seed cohort (MVP)

Labeled teaching dates — not live servicer scrapes. Never invent a borrower’s rate, monthly savings, or eligibility.

| Chip | View date | Teaching point |
|------|-----------|----------------|
| Not on autopay · 17 days left | 2026-09-13 | Enroll via servicer before Sep 30 |
| Already on autopay · no extra action | 2026-09-13 | Already-enrolled → additional 0.75% automatic (ED) |
| Unsure · check servicer | 2026-09-13 | StudentAid.gov ≠ autopay toggle |
| Last day · Sep 30 | 2026-09-30 | 11:59 p.m. ET cutoff |
| Window closed · Oct 1 | 2026-10-01 | Enroll-by passed · no invented late path |

## Calendar logic (public ED framing)

| Rule | Framing |
|------|---------|
| Enroll-by | **Sep 30 2026 11:59 p.m. ET** (ED Jun 18 2026 / StudentAid.gov) |
| Benefit window | Reduction through **Jun 30 2028** if enrolled by Sep 30 (or already enrolled) |
| Already on autopay | Baseline was 0.25%; already-enrolled get additional **0.75%** automatically (total 1%) — ED, not a Conglomerate estimate |
| Where to enroll | **Loan servicer** account — not a StudentAid.gov autopay toggle |
| Loan cohort (public) | Direct Loans originated after Jul 1 2012; defaulted borrowers must restore good standing first |
| Eligibility | Optional user flag only. Unknown → “not confirmed.” **Never invent eligibility.** |
| Savings | Never computed. BI Sep 1 2026 published an example (~$23/mo) — theirs, not shown as the user’s number |

## Ads pathway (ad-only free utility — do not spend yet)

| Path | Notes |
|------|--------|
| **Revenue (primary)** | **AdSense / display under the card + “Sep 30 autopay 1% interest reduction deadline” explainer** (not inside the PNG). Inventory spikes Sep 15–30. Justified when sessions cover hosting. Free card forever — **no paywall**, no Gumroad. |
| **Brand-safe** | Informational calendar literacy + public ED / StudentAid.gov cites. **Not** repayment-plan, consolidation, or forgiveness advice. Ads **not** inside PNG. **Hard avoid** student-loan refinance / debt-relief lead-gen affiliates that conflict with honesty brand. StudentAid.gov + own-servicer pointers only. |
| **Sponsorship (later)** | Optional nonprofit borrower-education sponsorship only if brand-safe. |
| **Acquisition (gated)** | Google “student loan autopay 1% interest reduction deadline” / “September 30 student loan interest” + Reddit promo week of Sep 15. Creative = “Paste today’s date + autopay status — days left to Sep 30”. Max CPA abort ~$0.30–0.50 without a completed share. Debit/cash only. **Spend only after one organic student-loan-thread test.** |
| **UTM** | Example: `?utm_source=reddit&utm_medium=organic&utm_campaign=autopay_interest_deadline_mvp` |
| **Tracking** | Card gens + share clicks (GoatCounter path when Pages is live). |
| **Abort sketch** | Pause paid if CPA exceeds band without share / “did you enroll yet?” replies. |

**No spend from this ready_for_pages step.** Ads are the monetization path (**ad-only OK**).

## Product constraints

- Single static site (no backend).
- **Flags only from user paste** (or labeled seeds). Never invent eligibility, interest rate, or monthly savings.
- Brand: **Autopay Interest Deadline** only on surface.
- Days-left badge and status chip text-labeled (not color-only). Disclaimer always visible on share PNG.
- Share = URL hash + PNG + copy summary.
- No servicer login. No NSLDS scrape. No Loan Simulator. No SAVE plan-choice advice. No sock “loan forgiveness” farms.

## Files

| Path | Role |
|------|------|
| `index.html` | App shell (GitHub Pages entry) |
| `app.js` | Countdown, status chip, seeds, card, share hash, PNG |
| `styles.css` | Autopay Interest Deadline UI |
| `scripts/build.js` | `npm run build` → `dist/` |
| `scripts/verify.js` | `npm run verify` — countdown + chip checks |
| `package.json` | build / start / preview / verify scripts |

## Opportunity

Internal card: `opp_finance_autopay_interest_deadline` (consumer finance / student loans).  
Experiment stub: `institutions/mde/experiments/exp_autopay_interest_deadline.md`.
