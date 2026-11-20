# ODOR DEV ROUND 8 — AMENDMENT A1 (FROZEN)

Date: 2026-11-02. Status: FROZEN — implement exactly as written; any
further change needs A2, never a silent edit. Zero worlds spent by
this doc. Parent: `docs/ODOR_DEV_ROUND8_PLAN_V1.md` (R8-V1, frozen,
stands except where this amendment explicitly overrides).
Scoping: `docs/ODOR_DEV_ROUND8_AMENDMENT_A1_SCOPING.md` (G1/G2 gaps,
prior-correction confound, candidate selection).

## What A1 changes (and nothing else)

1. **G1 mapping (explicit):** "reward" in R8-V1 §Instrument-1 is the
   supervised taste target (`record.target ∈ {0,1}`). Centered error =
   `(target − c) − prediction`. No other reading is licensed.
2. **Fixed-c REPLACED by adaptive EMA baseline:** R8-V1 §"The constant
   c" (triage-pinned scalar from traces) is STRUCK — G2 proved it
   unmeasurable (billing-polluted deltas, unlogged record signs) and
   the agnostic constant unsafe (sigmoid-floor saturation). In its
   place: per-agent online baseline state `c`, updated on every live
   taste record BEFORE the update it centers:
   `c ← c + α(target − c)`, centered target `t' = target − c`.
   Frozen values: **α = 0.05** (surpriseEma precedent, design choice
   stated here — not tuned, never re-tuned), **init c = 0** (the
   enabled instrument starts from exactly the null state).
3. **Scope of centering:** `tasteUpdate`, BOTH live and replay modes,
   using current c (replay replays history through present background
   belief — stated, frozen). c updates on live records only. Uniform
   +4 scalar ops per `tasteUpdate` call through `m` in both modes
   (sub(t,c), sub(t',pred) is pre-existing, EMA sub+mul+add = 3, plus
   1 center-sub = 4 new; replay path billed identically — symmetric
   billing preserved). Null-default (α=0) MUST be bit-identical to
   unmodified code (fixture-proven; with α=0, c stays 0 forever and
   the 4 ops are pure billing with zero behavior change).

## State, checkpointing, validation (implementation requirements)

- New agent state: `state.tasteBaselineC` (number, init 0). Lives
  alongside `surpriseEma` (same pattern: scalar EMA state).
- MUST be included in: body creation (init 0), checkpoint/compact,
  restore + validation (`keys()` lists), reset (back to 0),
  digest-covered state (so transplant/integrity digests cover it).
- Implementation checklist (for the code chunk, not code here):
  `createTasteEnergyBody` init + config key `baselineRate`
  (null-default 0, validated 0≤α≤1 like surpriseGain);
  `tasteUpdate` EMA+center (live+replay uniform billing);
  `resetTasteEnergyBody` reset; checkpoint/restore/validate/digest
  coverage; restore-compat (old checkpoints without the field → 0,
  explicit, tested).

## Fixtures (all GREEN before triage; frozen set = 3)

1. Centering math: preset c + known target/prediction → one
   `tasteUpdate` step reproduces hand-computed weights exactly
   (driven via direct calls with manually set `tasteBaselineC`).
2. Null-default identity: α=0 run over a fixed synthetic micro-world
   is digest-identical to unmodified code (bit-identity proof; the 4
   billed ops must not change behavior).
3. Billing: billed ops on a fixed trace match the frozen formula
   (+4 per `tasteUpdate` call, live and replay; totals reconcile).

## Triage (before execution; replaces R8-V1 triage §c-pinning)

- Bank check: 8 histories resolve, protocol hash recorded (unchanged).
- Init recording: α=0.05, c0=0 printed by the runner AND recorded in
  the bank protocol (two readings agree — same discipline, new values).
- Fixture report: 3/3 GREEN digests listed.
- Cap check: projected ops ≤ 40e9, wall ≤ 3600s (unchanged).

## Unchanged from R8-V1 (carried over verbatim by reference)

Bank (8 reused histories, dev-only); arms (centered + spent-R1
comparator); execution (8 mains, full probe set, single authorized
attempt, `redone: []` expected, no second attempt, R7 extinction
precedent); scorer (transfer-primary + taste-sign secondary +
acquisition gate); verdict (GO/PARTIAL/NO-GO fail-closed, NO-GO or
PARTIAL promotes fix (b), no re-tune — here: no α re-tune, no second
attempt); caps; non-goals; R1–R7 verdicts untouched.

## H8 restated under A1 (hypothesis unchanged, instrument swapped)

Adaptive centering breaks the uniform-pessimism attractor: centered
runs show (a) taste-weight means no longer uniformly negative
(posfrac ≥0.4 on ≥6/8 histories), and (b) transfer-current endpoint
beats R1-plain on ≥5/8 reused histories — with the acquisition gate
(A ≥ 80% of R1-plain on ≥6/8). Falsifier, bars, and promotions per
R8-V1 verdict section.
