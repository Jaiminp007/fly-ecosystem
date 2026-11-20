# TURN-GATE floor attribution — the residue is extinction (read-only, zero worlds)

Date: 2026-10-31. Method: read-only replay of frozen rows from
`evidence/turn-gated-dev/attempt-02/` (V1b), `attempt-04/` (V1d seg1–seg2),
`attempt-05/` (V1e seg1–seg4). No new worlds, no rescoring of verdicts,
no bank touched. Spent-bank MEASUREMENT (non-qualifying), same standing
as the V1c-motivating post-hoc and the V1c-A1 calibration.

## Finding

Flipped cues split by flip DIRECTION (train-valence → test-valence):

**Seg1 correctness (three independent lines/banks):**

| line | ben→harm (learn to turn) | harm→ben (unlearn turning) | gap |
|---|---|---|---|
| V1b (407xxx) | 0.804 (n=8) | 0.309 (n=8) | 0.495 |
| V1d (409xxx) | 0.798 (n=8) | 0.303 (n=9) | 0.495 |
| V1e (410xxx) | 0.804 (n=9) | 0.255 (n=8) | 0.549 |
| pooled | **0.802 (n=25)** | **0.290 (n=25)** | **0.512** |

The seg1 gap (0.51, n=50 flipped-cue observations) replicates to the
second decimal across three banks. New turn associations are answered
correctly from the first segment; suppressed turn associations barely
start correcting.

**V1e trajectory by direction (seg1→seg4):**

- ben→harm: 0.804 → 0.933 → 0.950 → **0.948** (all 9 cues ≥0.92; complete
  by seg2–seg3).
- harm→ben: 0.255 → 0.518 → 0.665 → **0.674** (range 0.39–0.87; slow,
  noisy, stalls; seg3→seg4 increment only +0.009).
- Gap narrows 0.512 → 0.274 but persists.

**Pair floors are composition, not mystery.** Seg4 per-cue means:
pair 1 (3 hard of 6 flips) 0.787; pair 2 (2 hard of 5) 0.878; pair 3
(3 hard of 6) 0.802. Pair 2's higher floor is fully accounted for by
having fewer extinction cues — deterministic bookkeeping, no extra
mechanism. (Means here are unweighted per-cue; G2a gaps differ slightly
by contact-weighting.)

**Regressions (3 cues seg3→seg4: −0.13/−0.07/−0.12).** Binomial SE at
n≈1000 is ≈1.5% — these are 4–8 SE, not independent-trial noise. Likely
explanation: contacts are dominated by few flies (correlated encounters),
so effective n ≪ nominal and segment means swing with subpopulation
sampling. Interpretation (per-fly data are NOT archived — instrumentation
gap, 5th occurrence alongside rounds 12–14 and V1e). Not a verdict issue
(gates use pooled statistics, unaffected).

## Confounds examined

- **Contacts (practice).** Harm→ben cues draw ~25% fewer seg1 contacts
  (~1300 vs ~1760 mean) — itself a signature: flies avoid train-harmful
  cues under carried weights (behavioral avoidance = acting on train
  valences). But practice doesn't explain the rate: dose-matched pair
  (pair 1: ben→harm cue 1,1,1,-1, 2789 contacts by seg2 → 0.95 vs
  harm→ben cue 1,-1,1,-1, 3673 contacts → 0.66) — MORE practice, WORSE
  outcome. Direction dominates dose.
- **Within-seg1 ambiguity (flagged, unresolved).** Ben→harm seg1-high
  (0.80) is consistent with BOTH fast within-segment acquisition AND
  immediate generalization (carried turn bias applied to new cues).
  Endpoint summaries cannot separate them; checkpointed within-segment
  scoring (a future line) could. The ASYMMETRY finding does not depend on
  this distinction — whatever puts ben→harm at 0.80 in seg1, harm→ben
  needs 4+ segments to reach 0.67.

## Reading (descriptive; motivates but does not start a line)

The transfer tax AND its floor are BOTH extinction phenomena. Acquisition
completes ~80% within one segment (or arrives free via generalization);
extinction closes ~70% of its gap in four segments and stalls. Rate ratio
is roughly an order of magnitude. A structural intervention should
therefore target UNLEARNING specifically — not general plasticity:
surprise-gated replay (Round 6: surprise IS the extinction signal —
prediction error on stale associations), asymmetric replay rates, or
extinction-specific passes. General capacity/architecture changes
(IB, canalizing-core) address the wrong half of the phenomenon.
Licensed next: an extinction-targeted intervention line under its own
frozen plan — NOT started. No RSI claim.
