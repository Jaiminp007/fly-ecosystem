# M-POP plan amendment V1a (add unlearned arm; newborn semantics)

Frozen 2026-10-29, BEFORE any bank/execution. Amends V1 ONLY as below.
Reason: the frozen grid (candidate/frozen) mislabels its own control —
`frozen` learns throughout phase A, so it cannot test "never learns".
The plan's stated intent ("selection alone") requires the true never-learns
arm. Correction, not redesign: keep both frozen arms, ADD `unlearned`.

## Changes

1. **Grid: 3 arms × 6 histories = 18 mains, zero probes**: candidate (learns
   always), frozen (learns phase A only, frozen from B on — INCLUDING
   newborns frozen at birth, for within-run consistency: a B-born learner
   in a frozen run must not learn while B-old-timers cannot), unlearned
   (frozen from tick 0, never learns). This decomposes the learning
   contribution: unlearned→frozen = value of phase-A-only learning;
   frozen→candidate = value of continued learning.
2. **Newborn semantics (frozen here, implemented as such)**: newborns are
   created zeroed with the run's options (standing variation = founder
   seeds + rng streams only); `unlearned`/`frozen` newborns are frozen at
   birth. No weight inheritance (still a future line — this design tests
   SELECTION, and unlearned-vs-candidate now tests whether learning matters
   at all for lineages, the cleanest version of the V1a question).
3. **Bars (unchanged in form, extended to 3 arms)**: G2 = candidate line
   persistence fraction MINUS UNLEARNED ≥ +0.15 (the never-learns control;
   frozen reported alongside, no bar). G3 = candidate max-generation >
   unlearned max-generation, OR mean descendants diff ≥ +1.0.
   Everything else (G1 feasibility, G4 caps, G5, resume terms,
   non-inclusions) stands as frozen.

## Explicitly not changed

Bank (388001–388054, 6×9); 1792 ticks; no probes; no mutation;
no checkpoints in Phase A; single attempt; no qual; no rescoring.
