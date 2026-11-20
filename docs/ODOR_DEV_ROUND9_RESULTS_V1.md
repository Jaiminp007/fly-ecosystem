# ODOR DEV ROUND 9 — RESULTS V1 (NO-GO: H9 falsified, line CLOSED)

Date: 2026-11-02. Single authorized attempt completed via crash-resume
under frozen `docs/ODOR_DEV_ROUND9_PLAN_V1.md` + `AMENDMENT_A1.md`.
`redone: []` (no completed row re-executed, no world re-run).

## Verdict: R9-NO-GO (all three prongs miss; fail-closed)

- Transfer-primary: distributional > R1 on **4/8** (need ≥5). Deltas:
  −0.90, −0.78, +0.55, +2.91, +1.25, −2.49, +2.78, −2.63.
  Misses by one — recorded, not shopped.
- Mechanism-secondary: upperMass ≥0.5 on **5/8** (need ≥6): 0.141,
  0.214, 0.536, 0.604, 0.708, 0.755, 0.385, 0.849. Misses by one.
- Acquisition-tertiary (difference-based): diff ≥ −0.5 on **3/8**
  (need ≥6): −0.73, +0.07, +0.23, −0.74, +3.39, −0.95, −1.55, −0.90.
- PARTIAL requires transfer ≥5/8: not met. **NO-GO.**

## What this decides

H9 is FALSE as frozen. The distributional representation MOVED the
mechanism more than centering ever did — five histories now carry
positive mean taste weights (+0.50 to +1.65; R8 had zero) and the top
head-mass reaches 0.85. The uniform-pessimism attractor, as a
description of means, is BROKEN on those histories. But transfer does
not follow: two positive-mean histories lose transfer (−2.49, −2.63),
one negative-mean history wins it (+2.78). Optimism WITHOUT transfer
is now measured, not hypothesized — the dissociation is the finding:
fixing what the weights SAY does not fix what the behavior CARRIES.
Per the frozen verdict: R9 CLOSED, fix (c) separate Go/No-Go
matrices promoted next. No K re-tune, no second attempt.

## Spend and provenance (all ledgered, zero duplicates)

- ~2.757e10 ops total (8 mains + full probe sets), under the 40e9 cap;
  wall inside 3600s. 8/8 mains complete; all 8 D-anchors carry K=8
  heads (n=2112 weights/history, pairs=192).
- Launch aborted on ENOSPC (environmental disk-full, C: transiently
  exhausted mid-history-4; not a verdict, not an instrument failure):
  3/8 rows complete and valid. Resume executed histories 4–8 fresh
  (history-4 partial trace removed pre-resume; nothing re-executed)
  via committed `scripts/odor-routed-r9-resume.mjs`, then recomputed
  comparisons + verdict from all 8 written rows. `redone: []`.
  Dual provenance: launch log + row files + resume log.
- Init: quantileHeads=8 (bank sha 60acdcb1…; r1plain copies verified
  byte-identical to R8 triage). Comparator: spent R1 rows, read-only.
- R1–R8 verdicts untouched (R8-NO-GO stands). No rescoring: the two
  near-misses (transfer, upperMass) are noise-at-bar per the
  C-series/R8 pattern — the bars stand.
