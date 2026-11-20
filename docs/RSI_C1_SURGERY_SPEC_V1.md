# RSI C1 surgery spec V1: S1–S4 engine changes (DRAFT, UNAPPROVED — no implementation authorization; design-only, zero worlds)

Parent: `docs/RSI_C1_DESIGN_V1.md` (the loop) — this doc prices the
substrate. Implementing needs (a) approval of this spec + (b) a
compounding operator (C1: insufficient-even-if-built stands).
Neither exists. No code written, no behavior changed by this doc.

## S1 — proposal channel (interface delta + schema migration)

- Add outputs: `propMenu` (0–8 float, rounded), `propParam`
  (scalar), `propFlag` (propose this tick if >0.5), `adoptFlag`
  (adopt if >0.5). `OUTPUTS` 5→9 (`engine.mjs:6`).
- Consequence: `HSTART=IN+OUT` shifts → genome node ids shift →
  saved genomes/golden fixtures break. Required: schema version
  bump + migration (same class as the parked kernel-as-advisor
  migration), OR append-only output indexing with legacy HSTART
  preserved (preferred: smaller blast radius; spec the chosen
  one at implementation freeze).
- Decoder (new, pure, unit-tested): outputs→(menuIndex, params,
  flags); all-zeros ≡ no-op. Null-default: decoder ignores zeros;
  legacy runs bit-identical.
- Why not `signal`: 1 scalar, mating/social use; temporal coding
  needs memory+protocol+decoder — larger, not smaller.

## S2 — agent-triggered sandbox (extend the existing hook)

- Insertion point: the engine's `experimentController` hook
  (`engine.mjs` advance loop: per-fly `experimentController?.(f,
  inputs, tick)` + `afterController/afterEnergyCharge/afterStep`).
  Today the harness passes this in; S2 adds an AGENT-initiated
  path: `propFlag>0.5` → engine forks the agent's taste-state +
  genome into K eval sandboxes on its retained experience
  (fit/test split, C-series clone math), bills the flat eval fee
  (V1c math), returns results next tick.
- Fee metering reuses `experimentCosts` (`energyCost` charge path,
  already per-agent per-tick). Sandbox count K frozen (e.g. K=2:
  fit+test worlds, no held-out search — anti-fishing).
- Null-default: flag never set → zero forks, zero fees, path
  unexercised; suite green.

## S3 — agent-triggered adoption writes (capability-gated)

- Target paths (today harness-only): taste-config writes
  (`clone.config.replayGain/surpriseGain/tasteRate/sparseUpdate`
  — cf. `rsi-operator-loop.mjs:97-120`) + weight transplant
  (`copyWeights` path, today in experiment scripts only —
  move an engine-level equivalent in).
- Gate: `adoptFlag>0.5` AND sandboxed testGain ≥ +5% (C-series
  bar, checked engine-side, not agent-claimed) AND capability
  flag `config.selfMod` on (default OFF — non-RSI runs cannot
  self-modify even if outputs glitch).
- Reward note (flagged, not chosen): current reward
  `netIntake-cost` punishes proposal fees; options are (i) fee
  channel exempt from reward (like `experimentCosts` are costs
  but separately metered — precedent) or (ii) incentive surgery.
  Implementation freeze must choose; this spec does not.
- Rollback: pre-adoption snapshot retained; engine restores on
  N-tick live regression (bounded regret; N frozen).

## S4 — evaluation inputs + checkpoint slots

- Add inputs: `fitGain`, `testGain`, `feePaid`
  (`INPUTS` 17→20; same HSTART/schema note as S1 — one
  migration covering S1+S4 preferred).
- Checkpoint store: per-agent bounded slots (e.g. 2: pre-adoption
  + last-known-good), engine-side, keyed by agent id, cleared on
  death/birth (no lineage leakage — inheritance carries weights
  per existing rules, never checkpoints).
- Null-default: slots empty, inputs zero → behavior identical.

## Invariants (all four surgeries)

- Null-default bit-identity: everything default-off ≡ current
  behavior; full golden suite green with channels off (proven
  before any capability-on test).
- Billing: every new op (fork, eval, write, checkpoint) charged
  through metered paths; no free compute.
- Capability gating: `config.selfMod` default OFF; adoption path
  physically unreachable when off.
- Test criteria: unit (decoder exactness, fork/eval math,
  restore round-trips), integration (propose→adopt→checkpoint→
  rollback in sandbox), null-default (suite green off).

## Status

DRAFT-UNAPPROVED. This spec authorizes no implementation. The
next touch is approval + an implementation freeze (with line-pinned
insertion points and the S3 reward choice) — which additionally
requires the compounding operator the C1 verdict prices. Until
then: substrate unbuilt, Track C stays designed-not-implemented.
