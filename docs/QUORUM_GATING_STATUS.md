# QUORUM-GATING STATUS: REJECTED (void runs stay informative; peeking destroys diagnostics)

Queued item (quorum-gated early stopping: stop an attempt when
the verdict is mathematically decided) adjudicated on frozen
evidence. Zero new worlds. Status: REJECTED, reversibly
(revisit iff op costs bind — they don't: caps hold with margin).

## The case against (V1 as natural experiment)

- MATE-WINDOW V1 control went 0/6 FIRST (arms run in order:
  control, early, late, full). A quorum gate (stop when
  INCOMPLETE foreseeable?) would have fired after the
  control arm — and DESTROYED the attempt's only findings
  (early 5 > control 0 = late; full 11 (enrichment works);
  the directional pattern that motivated V2 (GO-WINDOW)).
- Void verdicts stay informative DESCRIPTIVELY (per-arm
  totals, seed spreads, reference behavior) even when the
  floor voids the verdict. Early stopping optimizes for
  VERDICTS (save ops) at the cost of DIAGNOSTICS (lose
  the patterns that design the next line). V1 is the
  proof: the void run designed V2.
- Peeking needs alpha-spending (group-sequential boundaries
  per verdict type, binding no-restart): machinery for a
  saving that isn't needed (worst attempt 4.2e9 vs 5e9 cap;
  24 mains ≈ 3 min wall). Cost (complexity + bias surface)
  exceeds benefit (marginal ops) by an order of magnitude.

## Disposition

- REJECTED (frozen full-run stands: every authorized attempt
  runs to completion, verdict or void, no peeking).
- Revisit condition (pre-registered): op costs binding
  (attempt routinely within 10% of caps) OR wall clock
  binding (>50% of cap). Neither holds.
