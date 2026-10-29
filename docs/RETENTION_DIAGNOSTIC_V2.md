# Retention-interference diagnostic on frozen V2 artifacts (analytic only)

Status: **Frozen diagnostic COMPLETE — no new executions, no seeds spent, no claims.**
Method: read-only dissection of `evidence/body-transfer/v2/attempt-01/` anchors
(`atA/atB/atC` full learner states) + row probes + `results.json`. Nothing ran;
the world count stays 5128 + 440 + 688.

## Question

29 idea-classes + body transfer all died on gate-5 retention detail (±0.1, one leg
slightly negative). Nobody ever asked *what* differs, inside the learner, between
a history that retains and one that doesn't. The anchors make that askable.

## Findings

1. **Recent-buffer washout is total and universal.** At checkpoint C the 8-slot
   `recent` buffer contains ZERO examples of the A-phase dominant cue on all 16
   history×body cells. The 24-slot `older` buffer holds 14–29% A-cue. Pass and
   fail histories are indistinguishable here (fail range 14–21%, pass range
   14–29%, overlapping).
2. **Weight drift is massive and uniform.** Mean taste-weight displacement A→B ≈
   5.2–5.8 and A→C ≈ 7.6–8.4 (L2) on every cell, N and Q alike, pass or fail.
   Drift *magnitude* does not discriminate retention (+1.2 best vs −0.68 worst
   with overlapping drift ranges).
3. **Drift *direction* is uniform too.** Cosine(A→B displacement, A→C
   displacement) ≈ +0.75–0.79 on all 16 cells: the C phase continues in the
   B-phase direction. No discrimination.
4. **Readout gain is frozen.** `tasteScale` = 0.250 on every learner, every
   checkpoint, every cell. The policy readout amplifies whatever microscopic
   directional residue survives — identically everywhere.
5. **N and Q are mechanistically identical here.** All metrics overlap across
   bodies; Q sits lower on retention only because its level is lower
   (g1 +3.89 vs +5.83 → less headroom), not because it interferes differently.

## Interpretation (descriptive, not a claim)

No checkpoint-level mechanism metric — buffer composition, drift magnitude,
drift direction, gain — discriminates retention outcome. The ±0.1 retention
detail lives **below the resolution of every macroscopic handle the program
ever turned**. This is the mechanistic counterpart of the synthesis finding:
budget dials reallocate rehearsal *volume*, but retention is decided by
directional *residue* no volume dial can see — which is why bank noise
dominates and nothing replicated. The program was steering a variable its
instruments cannot resolve.

## Anomaly noted (not pursued)

Critic weight norm is 0.000 on every alive learner at every atA checkpoint.
Either the critic is vestigial under the progress rule or its weights live
elsewhere. Flagged for the next line; no conclusion drawn.

## What this licenses (proposal, not a plan)

Three lines, all outside the 29 exhausted classes, in recommended order:

1. **Bigger ruler (evaluation-scale line).** Predeclare a hierarchical
   multi-bank protocol (≥20 banks, random-effects criterion) that resolves
   ±0.1 retention detail. If the variable is real but small, buy resolution
   before steering. No learner change; the claim would be methodological.
2. **Directional anchoring (architecture line).** Protect the *direction* of
   the readout (two-timescale slow weights, e.g. `two-timescale-taste.mjs`
   machinery — never tested) instead of reallocating rehearsal *volume*.
   The diagnostic says volume handles are blind; direction handles are the
   untested axis.
3. **New sense (Option B, information line).** Add genuinely new information
   (e.g. the unimported `localResourceSense` amount channel) to lift level
   headroom. Helps level, not retention per se — weakest of the three for
   the actual killer, strongest for Vision-milestone-4 continuity.

None is executed, banked, or predeclared here. The next step is a frozen
plan for exactly one of them, under a new goal, with fresh banks.
