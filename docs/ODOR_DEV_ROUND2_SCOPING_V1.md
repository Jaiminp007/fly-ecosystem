# ODOR DEV ROUND 2 SCOPING V1 — interleaved A-rehearsal (NOT FROZEN)

Date: 2026-11-02. Zero worlds. Status: SCOPED. No license, no bank,
no code, no execution. A frozen dev plan is required before anything
runs. Bank protection holds throughout: same 8 reused histories,
never the closed reserves, no fresh bank.

## Baseline (round 1, outcome-informed, dev only)

- Transfer: +0.42 vs reset (5/8, need 6/8); +0.36 vs cheap
  native-full (5/8); −0.55 vs guarded (0/8, descriptive).
- Retention: A 22.48% (need 95%), B 179.07%.
- Survivors: learned 20/192, frozen-A 60/192, reset 30/192.
- Motor-freeze: +7.43 vs continuous (8/8) but +0.30 vs frozen-A
  (3/8) — survival via stopped exploration, not proven skill.

## Mechanism hypothesis (outside-box, theory-first)

The retention asymmetry (A 22% vs B 179%) is a recency gradient:
sequential A→B→C→odor overwrites early tasks (classic catastrophic
forgetting — the mirror of the transfer wound: there the old
response won't extinguish; here the old skill won't persist).
Freezing preserves without learning (60 survivors, no skill gain).
The principled lever is REHEARSAL: interleaved A-exposure during
B/C (complementary-learning-systems theory — hippocampal replay
protects neocortical priors). Round 1's fixed 512/512/512/256
curriculum never re-exposes A. Round 2 tests whether redistribution
of the SAME acquisition tick budget with A-rehearsal slots lifts
A-retention and (via better-preserved A steering) transfer.

## Design (dev-legal)

- Histories: the same 8 reused (round-1 rows reused read-only as
  the fixed-curriculum baseline — no re-spend).
- Arms (new): learned-interleaved only, plus identical frozen-A/B
  probes and identical D-state transfer probes (reset, cheap
  native-full comparators rebuilt from the same D bodies per the
  round-1 protocol).
- Curriculum: FIXED total acquisition ticks (same budget as round 1),
  redistributed with A-rehearsal slots (exact schedule at freeze;
  e.g. A-B-A-C-A-odor with equal phase masses — the freeze fixes
  one schedule, no tuning).
- Gates (unchanged): transfer 6/8 vs reset AND cheap native-full
  with nonnegative survivor diffs; A-retention 95% (saved-over-reset
  with support). Descriptive GO/NO-GO (dev, not qual).
- Guarded diagnostic (zero worlds, pre-freeze): read the guarded
  steering policy (`odor-routed-experiment.mjs` steeringMode) and
  record WHAT it does that learned doesn't — informs whether the
  −0.55 gap is reachable or structural. Filed, not gated.

## Open item #4 CLOSED — guarded diagnostic (zero worlds, code read)

Guarded = physics-informed energy gate: `overlapGuard` computes
requiredEnergy from turn+travel ticks given speed and lastCost;
guarded mode forces go ONLY when the midpoint is available AND
wall-clear AND energy-viable (`odor-routed-experiment.mjs:119`,
`guarded-overlap.mjs`). Native forces stop. Learned must discover
the gating — and its feature vector HAS normalized energy
(`features[1] = energy/120`) but NO viability boolean and no
requiredEnergy. The −0.55 gap is therefore an information-use gap
with a crisp candidate mechanism: GUARD-FEATURE AUGMENTATION —
feed `guard.viable` (+ requiredEnergy) as explicit learner inputs.
New input channel, not tuning; falsifiable (if the gap persists,
it is policy-expressiveness, not information). Filed as the
recorded ROUND-3 candidate (round 2 stays single-hypothesis:
rehearsal). Freeze decides only if round 2 closes first.

## Open items #1–#3, #5 CLOSED (analytic; freeze adopts verbatim)

- #1 schedule (frozen candidate): A256–B512–A128–C512–A128–D256
  = 1792 ticks (SAME budget as round 1). Minimal deviation: B/C/D
  masses identical to round 1; A split 512 → 256+128+128. A-first
  preserved (anchors + frozen-A comparability); ends in D (transfer
  probes from D state, unchanged); B/C ≥256 contiguous (B/C
  acquisition comparable); two A-rehearsal slots.
- #1b seed rule: A-revisits reuse `history.resourceSeeds[0]` (same A
  geometry, literal re-exposure). No new seeds — bank-safe by
  construction; the 8 reused histories suffice unchanged.
- #2 instrument change list: current machinery caps at 4 phases
  (`CONTINUAL_PHASES` length-locked; `phaseDurations` must match).
  Required: a 6-entry rehearsal phase table (new export, A-slots
  kind 'stable' nutrient .4 shiftEvery 0), anchor rule (anchor every
  slot; the FINAL A-slot is THE 'A' anchor for frozen probes; keep
  all six for audit), dev-script curriculum flag. Fixtures for the
  new table (slot order, tick sums =1792, anchor keys, seed reuse).
- #3 cap rule: extract round-1 totals from the archived evidence
  tar at freeze time (read-only) and set absolute tick/op/wall caps
  at ×1.5 (one new arm + identical probe suite on the same 8
  histories — bounded by construction).
- #5 verdict mapping (frozen): GO iff transfer gate (6/8 vs reset
  AND cheap native-full, nonnegative survivor diffs) AND A ≥ 95%
  AND B ≥ 95% (rehearsal must not rob B — stricter than round 1,
  justified); PARTIAL if transfer+A pass but B < 95% (round 3 must
  protect B); else NO-GO (rehearsal hypothesis closed; round 3 =
  guard-feature). Descriptive (dev, not qual) in all cases.

Remaining before execution: the frozen dev plan doc (mechanical from
this scoping) + its fixtures. Still NOT FROZEN.

1. Exact rehearsal schedule (phase masses, slot positions) under
   the fixed-tick budget.
2. Instrument change list (`odor-routed-development.mjs` curriculum
   builder; new code path needs fixtures — dev-fixture standard?).
3. Tick/op caps for the new arm + probes (8 histories × setup).
4. Guarded-policy diagnostic read + filed note.
5. Verdict mapping (what round-2 outcome triggers qual-freeze
   consideration vs what closes the rehearsal hypothesis).

## R738 addendum (rehearsal file — 4 outside legs, filed unlicensed)

- Dream rehearsal (Nijjer): the ACTOR forgets even under unbounded
  replay while the world model retains — which-component-forgets is
  measured, not assumed. Sharpens round 2: rehearsal slots must
  re-expose the STEERING policy (actor), not just observations;
  slot design should verify actor re-engagement (action-support
  readback, round-1 precedent: 20/20 survivors sampled all speeds).
- Curricula+replays (Tee): random replay effective-but-limited;
  review-like ordering helps. Slot POSITION (not just mass) is a
  design variable for the freeze.
- MSSR (Lu): fixed interleaving limited; memory-aware adaptive
  scheduling wins. Round 2 freezes ONE fixed schedule (no tuning);
  adaptivity is a successor hypothesis, not this round.
- Complementary replay (Rostami): generative coupling of current to
  past via embedding. Our substrate has no generative path — noted
  as the reason round 2 uses literal re-exposure, not generated
  replay (honest substrate limit).

## What this is not

Not qualification (reused histories, outcome-informed). Not a
promise that rehearsal works (B 179% warns that more exposure can
hyper-retain — rehearsal could push A past 95% while distorting B;
both retentions gate). Not licensed to execute.
