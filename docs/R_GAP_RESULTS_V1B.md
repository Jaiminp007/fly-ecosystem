# R-GAP results V1b — bias-corrected recomputation (NOGO, line CLOSED)

Frozen plan: `docs/R_GAP_PLAN_V1B.md`. Zero new worlds, zero bank contact
(pure recomputation on the frozen Phase-A ledger, D1-FIX V4 precedent).
V1 verdict (INVALID-BILLING) STANDS UNTOUCHED — this is a new measurement,
not an overwrite. Output: NEW file `dev-results-v1b.json` (attempt, rows,
ledger, anchors all untouched; dual provenance recorded).

## Verdict: V1B-NOGO (computed per frozen formula)

Corrected gaps (mean |A|,|B| − transfer, per history):
control 0.574 | S1-shared −0.858 | S1-appetite −0.861 |
S2-frontload 0.619 (+0.045) | S2-recent 0.458 (−0.116) | S3-tdwarm 0.557 (−0.017).
Best = S2-frontload, gain +0.045 < +0.5 → NOGO. Guards: zero corrupt
(all |dT| ≤ 5.0); sign check passed-vacuous (best is tiny positive);
baseline sanity holds (control raw 0.574 ∈ [0.5, 2.5]).

## What the correction proved (the S1 story, closed properly)

- S1's apparent advantage (+0.23 raw) reverses to −0.86 once pause-bias is
  removed: shared/appetite policies pause where zeroed cruises, and pausing
  loses energy in THESE ecologies too. The bias was BIGGER than the signal.
- The correction is validated by its neutrals: S2/S3/control transfer gaps
  were exactly 0.0, so their corrected numbers are bit-identical to raw —
  the formula moves ONLY what the confound touches (if it had moved S2/S3,
  the script would be wrong, not the data).
- Pause-bias direction is consistent: trained < zeroed in transfer on all
  12 S1 history-arms (0.3–3.8). No billing confound is possible here — reset
  preserves charge, compact equalizes memory/eligibility/hold on both probes,
  work sub-counters are diagnostic-only (verified read-only), and probe
  decisions are deterministic greedy functions of weights.

## Line status: CLOSED (no Phase B — gate requires GO)

No proposal reaches +0.5 raw OR corrected; the two apparent signals (S1
raw gap, S2-frontload +0.045) are bias and noise respectively. R-GAP's
answer stands across both verdicts: the trained-vs-zeroed gap is real
(+0.6–1.3 baselines everywhere measured), small, and unmoved by
representation, scheduling, or critic-side changes. The ARENA contexts
(M-DISCRIMINATE) remain the licensed testbed — for a future intervention
with a mechanism the pull family lacked, not for further search here.
Cumulative: 7396 + 252 = **7648** (V1b added zero).
