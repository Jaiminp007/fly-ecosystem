# BALDWIN results — V1 CLOSED AS SPECIFIED (metric void; mechanism untested)

Frozen: `docs/BALDWIN_PLAN_V1.md`. Single authorized attempt: 12 mains
(3 arms × 4 histories, fresh bank 402001–402036), 0 probes. No crashes,
no resume (`redone: []`). Ledger exact
(12/0/21504/516096/2.06e9 — verified: 12×1792 ticks, ×24 founders).

## Mechanical verdict (frozen mapping fired correctly, artifact preserved)

dev-results.json (UNTOUCHED — no rescoring, no recomputation):
**DESIGN-FAILURE**, 12/12 episodes censored, all medians null.
G1 ✓ (12 rows, endpoints finite). G2 ✓ (all rates match arms).
The mapping did exactly what was frozen. What follows does not alter it;
it states what the verdict can and cannot mean.

## The bar was unreachable-by-construction (floor-void proof)

- Reference = own phase-A max = **65.02 at tick 1, n=24** — the initial
  endowment transient, NOT learned performance. Bar = 0.8 × 65.02 = 52.0.
- Best return-A raw mean observed, ANY arm, ANY tick: **12.1**
  (means ≈10–12 across return-A for all arms). Bar exceeds best-observed
  by 4.3×. No relearning process can "relearn" starting endowment —
  learning does not create endowment. The metric measures
  endowment-recovery (impossible by definition), not relearning.
- V1a avoided exactly this trap via cross-arm SAME-TICK reference
  (reset vs candidate at identical ticks: endowment cancels). My
  self-referenced-max design reintroduced the transient. Lesson recorded.
- Consequence: G3/G4 machinery cannot produce a mechanism verdict — the
  run yields NO evidence on consolidation (neither GO nor falsification).

## What the evidence DOES support (descriptive, valid regardless)

- Return-A energetics collapse to ~20% of phase-A for ALL arms (ecology
  fact: post-scarcity depletion + halved populations; endpoints stay
  BT-normal ≈ −60 all arms, consistent with saturation, not with
  arm-differences).
- Post-hoc same-tick contrast (ZERO new worlds, frozen rows — and
  UNCLAIMED: post-hoc, n=4, small): return-A mean-of-means cons0 11.24,
  consWeak 11.81, consMod 12.05; consMod > cons0 in ALL FOUR 64-tick
  blocks (+0.6–0.8). Consistent ordering, small effect. Recorded ONLY as
  the hypothesis a follow-up would pre-register (level-based return-A
  bar), never as a finding. Per anti-shopping rules it cannot support GO.

## Line status: CLOSED AS SPECIFIED, mechanism UNTESTED

BALDWIN V1 tested consolidation-for-return-A-relearning-speed. Its episode
cannot test anything (floor-voided bar); B/C episodes are saturated at 0
per V1a. No discriminating episode for relearning speed exists in BT → the
line AS SPECIFIED is exhausted. Consolidation itself is NEITHER supported
NOR falsified (contrast with a NOGO, which would assert failure). Any
follow-up needs a pre-registered level-based bar on a fresh bank — proposed,
never started.

## Standing lessons (program-level)

1. Every future metric gets a FLOOR guard mirroring G4's ceiling guard
   (bar must be reachable-by-construction for the control; reference must
   be learned performance, never endowment transients).
2. Prefer cross-arm same-tick references (V1a pattern): transients cancel
   by construction; self-referenced maxima inherit them.
3. Post-hoc contrasts may CONFIRM negatives or GENERATE hypotheses, never
   claim effects (asymmetric rule, applied here: the +0.6 ordering is
   hypothesis-only).

## Cumulative: 7491 + 12 = 7503 (all ledgered, zero duplicates)
