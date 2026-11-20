# MATE-FOOD Plan V1 — Amendment V1A (pre-code factual correction + verified mechanism)

Date: 2026-10-26. No code written, no worlds run, no bank built — this
amends the DESIGN ONLY plan before implementation (same standing as
TURN-GATE V1c-A1/A2, V1d, V1f-amendment... none; this line's first).

## Issue

`docs/MATE_FOOD_PLAN_V1.md` specifies "control nutrient 3 = base",
citing the World default. Read-only verification chains the truth:

1. `TasteExperiment` hardcodes `nutrient:.4` in its World config
   (`learning/taste-experiment.mjs`), and `git log -S` dates that
   literal to the base commit (`ad0713b`) — so EVERY taste run ever
   executed (V1 included) ran at nutrient 0.4, never 3.
2. The phase table (`CONTINUAL_PHASES`, frozen) sets nutrient per phase
   — A:0.4, B:0.4, C:0.2 (scarce), return-A:0.4 — and `enterCuePhase`
   (`learning/cue-foraging.mjs:29`) OVERWRITES `world.config.nutrient`
   on every phase entry. A constructor-passed nutrient would be dead on
   arrival (overwritten before the first tick advances past phase entry).

So the plan is wrong twice: the control value (0.4, not 3) AND the
plumbing (phase table rules, not the constructor).

## Amendment (replaces the nutrient paragraphs; everything else frozen)

- Control arm: nutrientOverride `null` = legacy phase table EXACTLY as
  V1 ran it (0.4/0.4/0.2/0.4 across phases — INCLUDING the C-phase
  scarcity dip; bit-identical behavior when unset).
- Enriched arm: nutrientOverride `5.0` = FORCED CONSTANT across all
  phases (the C dip is flattened — that IS part of the enrichment:
  maximum lawful food availability throughout).
- Contrast: phase-varying 0.4/0.4/0.2/0.4 vs constant 5.0. Stronger
  than planned (V1 ran the low end of its own ecology) with the
  unchanged boundary-test rationale.
- Engine change (frozen): `TasteExperiment` gains optional
  `nutrientOverride=null` (asserted null-or-[0,5]); after EVERY
  main-run phase entry (constructor + `step()` phase advance) the
  experiment re-asserts `world.config.nutrient` when the override is
  non-null. Probe paths (`runTasteProbe`) intentionally untouched
  (legacy phase behavior; V1f runs zero probes). All prior experiments
  construct without the flag → bit-identical (M-ACT/MATE-ENERGY
  null-default precedent). No other engine file changes.
- Fixtures add: plumbing test (default null → phase table values
  incl. the C dip at 0.2; enriched → constant 5.0 across BOTH phase
  boundaries incl. C — run to tick 1100 to prove the dip is
  suppressed); V1-parity (control config == V1 maternal arm).
