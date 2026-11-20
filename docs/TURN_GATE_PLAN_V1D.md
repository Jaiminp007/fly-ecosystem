# TURN-GATE Plan V1d — extended-exposure plasticity probe (DESIGN ONLY)

Status: FROZEN 2026-10-31. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question

V1b+V1c (replicated finding, n=6 pairs, two banks): carried weights retain
same-valence associations (≈0.94–0.95) while flipped cues sit in
near-chance partial correction (0.53–0.68) after 1792 ticks on the test
codebook. Untested: is the residue TRANSIENT (slow relearning — more
exposure converges it) or STRUCTURAL (asymptote well below train —
stale-replay interference or capacity limit)?

- H-plastic: flipped correctness converges toward same-val/train level
  with doubled exposure (cumulative 3584 ticks on the test codebook).
- H-rigid: flipped correctness asymptotes inside or below the 1× band
  (no meaningful convergence; tax is structural).

## Design

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b/V1c):
1. **train** (1792, on H_tr) — snapshot end weights (as V1b/V1c).
2. **transferred-seg1** (1792, fresh run on H_te + transplant of
   train-end weights) — the V1c replication arm; carries the GATES.
3. **transferred-seg2** (1792, fresh run on H_te + transplant of
   SEG1-END weights) — the exposure-doubling arm. Second application of
   the identical transplant machinery (snapshot/copy/assertFreshTarget/
   integrity); seg1 rows must therefore persist weights (instrument
   change from V1b/V1c, where only train rows did).
4. **unlearned** (1792, on H_te) — flat control, unchanged.

Why fresh-run + transplant for seg2 instead of continuing seg1's run:
a run TERMINATES at phase end (`taste-experiment.mjs`: `finished=true`
once phaseIndex≥4; `advance` stops) — continuation is mechanically
impossible, so cumulative exposure requires re-instantiation. This also
stress-tests carryover robustness twice per pair (bonus, unclaimed).

12 mains, 0 probes, BT_TICKS=1792 every arm (ledger unchanged in form:
21504 worldTicks, 516096 founderSlots expected).

## Gates (seg1-gated; seg2 descriptive)

Identical bars on the V1c-identical arms (train + transferred-seg1 +
unlearned): G1 transplant-integrity on ALL 12 rows (join ≥0.99; scorer
covers the extra `transferred-seg2` tag automatically) + G0 train ≥0.5
all 3 else INCOMPLETE-UNTRAINED + G2a seg1 mean ≥0.3 + G2b unlearned
flat ≤0.1 all 3. Verdict PHASE-D-GO/NOGO (+INCOMPLETE/INVALID fail-closed).

DESCRIPTIVE (non-gating) seg2 flip-split (Amendment-A1 metric, frozen
band reused): report same/flipped/replayed correctness of seg2 vs the
SAME train row, plus seg2−seg1 flipped delta. Pre-registered
interpretive bands (recorded separately from the verdict):
- seg2-flipped ≥0.85 → CONVERGED (H-plastic supported; V1e may GATE on it).
- seg2-flipped in [0.4,0.7] → RIGID (H-rigid supported; tax structural).
- seg2-flipped <0.4 → DEGRADED (overtraining/interference failure mode;
  line re-opens under a new plan).
First 2× measurement by necessity descriptive: the band is validated for
1× exposure; applying it to seg2 as a gate would be uncalibrated. The
progression mirrors V1c (mechanism descriptive first, gate later).

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-04/`: 6 histories × 9 = 54 seeds
409001–409054 (verified clean 2026-10-31 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 408001–408054 + all fixture seeds). Same 9-seed history structure
(seg2 reuses the test history object — no new seeds needed). Caps: ≤300
exec (12 used), ≤20e9 ops, ≤3600s wall, ≤100MB. Single authorized
attempt; crash-resume with dual provenance only.

## Why this advances the program

Decides whether the transfer tax is a speed problem (fixable: replay
modulation, surprise-gating per Round 6, longer deployments) or a
structural problem (needs architectural change: canalizing-core/periphery
per Round 13, or capacity relief per IB diagnostic). Either outcome
licenses a specific V1e; a rigged-middle outcome (seg2 ≈ seg1, rigid)
kills the "just wait longer" hypothesis early. No RSI claim.
