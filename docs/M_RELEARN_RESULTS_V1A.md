# M-RELEARN V1a results — re-measurement (CEILING-PROVEN, line CLOSED)

Frozen plan: `docs/M_RELEARN_PLAN_V1A.md`. Single attempt, no crash, no resume
(`redone: []`). Ledger exact: 24 mains / 0 probes / 43008 ticks / 1.03M slots
/ 3.78e9 ops — all caps. Verdict: **CEILING-PROVEN → line CLOSED**. No V1b
(nothing slow was observed). No qual spent.

## Verdict (frozen rule applied as written)

- Ticks-to-criterion (80% of candidate same-tick, 8-tick sustain, per-tick
  death guard): **0 on all 12 episodes** (6 histories × B/C), 0 censored.
  Median 0 ≤ 64 → CEILING proven FOR REAL (reachable criterion, per-tick
  resolution — the V1a fix worked as designed).
- Wipe costs literally 0 ticks: reset (zeroed at the wipe) meets 80% of the
  trained candidate's level from the FIRST post-wipe tick, sustained.

## Why zero is real, not an artifact (ledgered per-tick curves)

- Reset vs candidate per-tick means are identical to 0.1 resolution BEFORE
  the wipe (deterministic same-learning, expected) AND from tick 512/1024
  onward (e.g. 44.5/44.6, 27.3/27.0, all 24 founders alive). A single tick
  cannot re-train 27 weight dimensions — so the identity means learned
  weights do not change behavior here: zero-weights+greedy (always-cruise)
  ≡ trained policy, per-tick, in moving AND scarce contexts.
- This is the mechanism behind every prior null: transfer fails (nothing
  behavioral to transfer), retention interventions fail (nothing behavioral
  to protect), reset≈candidate everywhere (same policy, different weights),
  and M-ORIGIN's level gain is exploration-avoidance (the unlearned arm is
  the ONLY one that behaves differently — it draws/explores while the rest
  effectively cruise).

## What this means for the program (discussion, not a bar)

- The objective function is now measured at its floor: readaptation time is
  0 ticks because there is behaviorally nothing to readapt IN THESE
  ECOLOGIES. Any future line that wants learning to matter must FIRST show
  a context where trained ≠ zeroed behaviorally — a pre-registered
  discrimination gate no family has yet passed (all prior gains were
  exploration-tax or sub-threshold).
- The 4 frozen Phase-B families are released untested (correctly — the gate
  for testing them was observed slowness, and none exists). Anti-rehearsal,
  the inverter, remains the most interesting untested idea IF a future
  ecology shows trained≠zeroed behavior first.
- Cumulative: 7348 + 24 = **7372**.
