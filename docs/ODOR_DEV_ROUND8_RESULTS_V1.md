# ODOR DEV ROUND 8 — RESULTS V1 (NO-GO: H8 falsified, line CLOSED)

Date: 2026-11-02. Single authorized attempt executed under frozen
`docs/ODOR_DEV_ROUND8_AMENDMENT_A2.md` (plan V1 + A1 carried).
`redone: []` for the authorized attempt (see launch disclosures below —
no row re-executed, no world re-run).

## Verdict: R8-NO-GO (all three prongs miss; fail-closed)

- Transfer-primary: centered > R1 on **4/8** (need ≥5). Deltas:
  −0.51, −0.14, **+2.58, +2.04**, +0.44, −2.26, **+2.53**, −0.84.
  Misses by one — recorded, not shopped.
- Sign-secondary: pooled posfrac ≥0.4 on **5/8** (need ≥6): 0.367,
  0.379, 0.386, 0.470, 0.485, 0.496, 0.500, 0.534. Misses by one.
  Taste means remain negative on ALL 8 (−0.36 to −1.43): centering
  moved fractions, not the attractor. The uniform-pessimism attractor
  PERSISTS under adaptive centering.
- Acquisition-tertiary: **0/8** — degenerate. ALL A-current
  budgetAdjustedEnergyPerFounder values are negative on BOTH arms
  (centered −0.92…−4.37; R1 −0.43…−4.12), so the frozen ratio gate
  (≥0.8×R1) is null everywhere. Difference-read: centered worse
  (more negative) than R1 on 7/8. Either math says acquisition did
  not survive centering.
- PARTIAL requires transfer ≥5/8: not met. **NO-GO.**

## What this decides

H8 is FALSE as frozen: adaptive EMA centering (α=0.05, c0=0,
live-commit/replay-center, uniform billing) does not break the
uniform-pessimism attractor and does not lift transfer (4/8 mixed,
±2.6 both ways — noise, not signal). Per the frozen verdict: R8
CLOSED, fix (b) distributional promoted next. No α re-tune, no second
attempt, no rescoring (the near-misses are noise-at-bar, consistent
with the C-series pattern — the bars stand).

## Instrument lesson (for future rounds, not a rescore)

The ratio acquisition gate was the wrong math for
negative-denominated energies (all-null when both arms go negative).
Future gates on budget-adjusted energies MUST be difference-based or
restricted to positive-denominated endpoints. Lesson recorded; R8's
fail-closed NO-GO stands unchanged.

## Spend and provenance (all ledgered, zero duplicates)

- ~2.680e10 ops total (8 mains + full probe sets), under the 40e9 cap;
  wall inside 3600s. 8/8 mains complete; all 8 D-anchors present.
- Launch disclosures: launch-01 aborted on a runner packaging bug
  (`digest().hex()`, 1-line repair, zero mechanism change — committed);
  launch-02 ran all 8 mains+probes+rows+anchors then aborted on a
  second packaging bug (r1plain bytes-vs-parse hash, 1-line repair);
  verdict recomputed by committed analytic resume script
  (`scripts/odor-routed-r8-resume.mjs`, zero worlds, no experiment
  imports) from launch-02 written rows. `redone: []` — nothing
  re-executed.
- Init: baselineRate=0.05, baselineC0=0 (bank sha
  42b6555c…; r1plain copies verified). Comparator: spent R1 rows,
  read-only, hashes in `evidence/odor-routed-development-r8/`.
- R1–R7 verdicts untouched. The taste-energy SPARE stays green and
  stays out of this verdict.
