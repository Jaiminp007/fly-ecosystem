# RSI C17 PROBE AUDIT V1 — the [-1⁴] attractor and the open-loop lesson

Zero worlds. Read-only on attempt-01 rows + deterministic codebook
recomputation (`makeCueCodebook` on bank cueSeeds). Analytic only.

## Findings

1. **Single-attractor selection.** 9 of 10 indexed reassignments
   chose the SAME surrogate, [-1,-1,-1,-1]; the 10th reassigned a cue
   to its own pattern (argmin no-op). The min-turn probe converged
   on one universal cruise address across legs, phases, and cues.
   (The bank contains 16 patterns; the probe used 1.)
2. **Aliasing map (deterministic).** The attractor coincides with a
   live cue-1 pattern in every leg: C-family valence +1 (beneficial)
   in legs 472010/472028; A-family valence −1 (harmful) in leg
   472046. So two legs aliased beneficial→beneficial, one leg
   beneficial→harmful — yet indexed underperformed exact in ALL
   three pairs (−0.251, −0.131, −0.107). Harmful-aliasing cannot be
   the whole story (it explains at most the 472046 leg).
3. **Per-pair consistency.** Indexed−exact HB gaps are negative in
   3/3 pairs; shuffled−exact negative in 3/3. The harm is systematic,
   not bank noise. BH stayed flat throughout (0.76 vs 0.80 pooled).
4. **Open-loop probe vs closed-loop behavior.** The probe asked "what
   would the frozen controller do on these (pre-trigger state,
   vector) pairs" — but reassignment changes the subsequent state
   trajectory, so post-intervention states leave the probed
   distribution. A min-turn address on sampled states need not remain
   min-turn on the trajectory it causes. The retain rule was meant to
   be the closed-loop check, but (a) it compared counts not rates
   (RESULTS V1: INVALID), and (b) even rate-correct, it verifies
   INTAKE, not turn correctness — and intake rose on every retained
   cue while HB correctness fell. Intake and correctness dissociated.
5. **Self-selection no-op is correct behavior.** When the argmin is
   the cue's own pattern, the mechanism no-ops (1/10). The evidence
   gate + selection correctly identified an already-optimal address.

## Successor constraints (for any future input-side license)

- Probe states must cover the POST-intervention distribution, or the
  probe must be closed-loop (predict → roll out → verify on the
  rollout). Open-loop propensity on pre-trigger states is shown
  insufficient by this attempt.
- The verifier must be CORRECTNESS (turn response on the cue), not
  intake. Intake↑ + correctness↓ is the observed dissociation.
- Rate-normalize all evidence comparisons (RESULTS V1 lesson stands).
- A successor must predict, in advance, why its addressing avoids
  the single-attractor collapse (9/10 to one pattern) — e.g. by
  penalizing occupied addresses or by requiring per-cue distinctness.

## R747 addendum (anti-collapse file — 4 outside legs for the
anti-attractor-collapse constraint, filed unlicensed)

- Value-collapse (Sheikh): ensemble learners converge to the same
  point, falling back to a single net; representation diversity is
  the fix. Direct analogue of the [-1⁴] attractor (16 options,
  1 used).
- Repulsive Bayesian (D'Angelo): saturation to single-model
  performance without functional diversity; repulsion as mechanism.
  A successor's selection rule needs an explicit repulsion term
  (e.g. penalize occupied addresses — already constrained, now
  with a named mechanism).
- Uncertainty collapse (Kirsch): collapse grows with complexity;
  implicit ensembling as explanation. Caution for successors:
  bigger banks (K=16 sufficed to collapse) don't fix collapse;
  the selection rule does.
- Repulsive PINN (Pilar): uncertainty over point estimates.
  Successor probes should report selection uncertainty (means
  distribution), not just the argmin — recorded, not gated.

## Status

Audit recorded; no verdict change (C17 stays INVALID-closed). The
locus remains open; these constraints join the C17-bar for any new
input-side rationale.
