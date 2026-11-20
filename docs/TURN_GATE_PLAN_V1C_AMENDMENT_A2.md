# TURN-GATE Plan V1c — Amendment A2 (pre-execution bank-range change)

Date: 2026-10-26. No code written, no worlds run, no bank built — this
amends the DESIGN ONLY plan before implementation (same standing as
Amendments A1 here and V1b-A1).

## Issue

The V1c instrument's spent-bank guard (`turnGateDevV1cBank` asserting
fixture seeds absent from all prior `evidence/**/*.json`) FIRES on the
frozen range: 406001–406054 has 2 hits in prior evidence
(`evidence/turn-gated-dev/fresh-02/protocol.json` +
`evidence/turn-gated-dev/attempt-02/protocol.json` excludedSeeds, plus
exact-integer hits in legacy anchor files).

Root cause (process failure, now understood): `docs/TURN_GATE_PLAN_V1B.md`
named the literal reserve range "406001–406054". The V1b bank builder's
source-token scan (`turnGateV1bExtraTokens`, which scans plan docs)
ingested those literals into fresh-02's `excludedSeeds` — an evidence JSON
— permanently bricking the range for future banks. Naming a reserve range
in a plan doc is functionally equivalent to spending it: the token-scan
guard cannot distinguish exclusion-listing from exposure, BY DESIGN
(fail-closed).

406001–406054 was never executed (zero worlds); it is not "spent" in the
execution sense, but it is mechanically unusable. No guard change is
licensed (the guard's breadth is load-bearing); the range moves instead.

## Amendment (replaces the bank range; everything else frozen)

- V1c bank range: **408001–408054** (6 histories × 9), verified clean
  2026-10-26 by guard-equivalent scan: **0 hits** in prior evidence
  (remaining grep hits are float-substring noise, V1a precedent — the
  guard matches exact integers under seed-keys only).
- 406001–406054 is DEAD for all future banks (do not attempt to clear,
  reuse, or "unbrick" it; record as reserve-poisoned by mention).
- Process rule going forward: plan docs name ONLY the range the current
  line spends; all future reserves are masked (`40xxxx`, never literals).
  Instruments/tests carry the literals they need (self-exclusion via the
  token scan is expected and correct — spent after the line executes).

Gates, bars, flip-split metric (A1), verdict strings, caps, and
single-attempt provisions are untouched.
