# RSI C1 design V1: agent-internal proposal loop (design-only, zero worlds)

Track C step C1 of `docs/VISION_COMPLETION_PLAN_V1.md`: "design the
internal-proposal loop (controller generates, sandboxes, and evaluates
its own revisions; checkpointed; budgeted) — Frozen design doc first,
then implement." This doc is the frozen design. Verdict: DESIGNABLE
but UNIMPLEMENTABLE with existing ops (4 specific engine surgeries
listed) AND insufficient even if built (inherits a non-compounding
operator set — C-series record). No RSI claimed; no worlds spent.

## What internalization means (vs the C-series external loop)

The C-series loop (`learning/rsi-operator-loop.mjs`) is fully
experimenter-driven: the harness selects from `OL_MENU` (0–8),
forks sandboxes, runs clone math, and adopts by privileged writes
(`clone.config.replayGain=...`, `clone.config.sparseUpdate=...`,
EMA zeroing). The controller's role is zero — it emits behavior;
`taste-energy.mjs` updates weights around it. An INTERNAL loop
moves all four acts inside the agent: the controller must emit
proposals, trigger sandboxes, read evaluations, and adopt —
checkpointed and budgeted from its own energy.

## The loop as designed (agent-driven protocol)

1. **Propose**: controller emits (menuIndex, params) on a proposal
   channel + a sandbox-request flag. Budget: each proposal debits
   a fixed energy fee (anti-spam), deducted before evaluation.
2. **Sandbox**: engine forks the agent (weights + algorithm state)
   into K evaluation worlds drawn from the agent's retained
   experience (fit/test split, same clone math as C-series).
3. **Evaluate**: engine returns (fitGain, testGain, fee) to the
   agent as INPUTS (new sensory channels, below).
4. **Adopt**: iff testGain ≥ +5% (C-series bar) the agent may set
   an adopt flag; engine applies the same config/state writes the
   harness performs today, then checkpoints (pre-adoption snapshot
   retained for rollback).
5. **Rollback**: iff post-adoption live performance regresses over
   N ticks, engine restores the checkpoint (bounded regret).

## The 4 surgeries (exact substrate gaps, with code pointers)

- **S1 — proposal channel.** Controller interface is fixed
  (`engine.mjs:5-6`: 17 inputs, 5 outputs turn/move/eat/mate/
  signal). No output can carry (menuIndex, params, flags).
  `signal` is one scalar (mating/social use). Required: new
  outputs or a decoded temporal protocol + harness decoder —
  unbuilt (same family as the ACT-void actuator gap).
- **S2 — agent-triggered sandbox.** Forks exist experimenter-side
  only. Required: agent-addressable fork/evaluate RPC with fee
  metering — unbuilt.
- **S3 — agent-triggered adoption writes.** Config/weight writes
  (`copyWeights`, `clone.config.*`, EMA init) are harness-only.
  Required: capability-gated self-write path — unbuilt. (Also
  reward compatibility: current reward `netIntake-cost`
  (`engine.mjs:168`) punishes proposal expenditure; a search
  budget needs incentive surgery or a fee-exempt channel.)
- **S4 — agent-readable evaluation + checkpoint store.** Sandbox
  results and snapshots exist harness-side (`snapshotWeights`,
  dev-results). Required: new INPUTS carrying (fitGain,
  testGain, fee) + per-agent checkpoint slots — unbuilt
  (same family as the ACT-void sensor gap: 17 inputs contain
  no self-model channels).

## The productivity inheritance (why architecture ≠ RSI)

Even with S1–S4, the loop would run the CURRENT menu — whose
record is: fires/adopts/carries (C2), adopted plain gains don't
transfer (C2: HB 0.949 vs 0.955), second fire usually fails
(C13), lossy beats exact (V1j), revision-adds-value closed twice
(C14/C15), transfer-side closed (C16), input-side bar unmet
(C17). Internalizing a non-compounding operator set changes the
locus (who proposes) but not the productivity (nothing
compounds) — and charges search costs to the agent's own energy,
making the C17-bar (better subsequent search + embodied
benefit) HARDER, not easier. Architecture is necessary but the
binding constraint is the operator: a compounding revision
(C17-bar) is a separate discovery, not a loop re-wiring.

## Implementability verdict

C1-DESIGNED, C1-UNIMPLEMENTABLE (S1–S4 unbuilt), C1-INSUFFICIENT
(menu has no compounding power). What changes the verdict:
(1) engine surgery S1–S4 (substrate work, Track-B-adjacent —
new outputs/inputs/RPCs, NOT a parameter tweak); (2) a
compounding operator clearing the C17-bar (genuinely new
input-side rationale, fresh bank). Neither exists. Track C
advances from "unbuilt" to "designed with specified substrate
requirements" — the loop is no longer vague, it is priced.
Line closed as design; implementation needs (1)+(2).
