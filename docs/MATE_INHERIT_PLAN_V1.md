# MATE-INHERIT plan V1 — vertical transmission of learned weights (FROZEN)

Status: FROZEN 2026-10-30. Single authorized Phase-A
attempt under its own plan. MATE-ACT / MATE-DENSE / MATE-ENERGY stand
preserved. No code, no bank, no worlds yet. Further changes require V1a+.

## Why this line (licensed by MATE-ENERGY GO + round-10 theory)

V1 proved births occur under bar-50 + decoupled gate. But verified
read-only: `syncNewbornLearners` builds newborns with ZEROED weights —
no vertical transmission exists anywhere in the program. Per the major-
transition view (round 10: replication must COUPLE to division), births
without inheritance cannot support selection. V1b tests the coupling:
maternal learned weights → newborns, exact copy, no mutation yet
(mutation is V1c; one variable per line).

## Design (single ablation)

- Newborn `run.learners[id]` initialization: control arm = current behavior
  (fresh zeros); inherited arm = copy of the MOTHER's learned weights
  (taste + actor + critic arrays, copied values, fresh work/eligibility/
  buffers/counters), maternal = `f.parents[0]` learner if present else
  zero-fallback (counted; expected ~never — learners are never deleted).
- New TasteExperiment constructor flag `verticalTransmission: 'none' |
  'maternal'` (default 'none' = current behavior exactly); read by
  `syncNewbornLearners` via the run object. Null-default, same pattern as
  `matingEnergyBar`. No engine changes (World untouched).
- Arms (2): zeroed (control: V1 replicate on a fresh bank — required, banks
  vary) vs maternal (test). BOTH arms: N=24, bar 50, reproduction true,
  decoupled gate. The ONLY difference is newborn weight initialization.
- Fresh dev bank `evidence/mate-inherit-dev/fresh-01/`: 6 histories ×
  9 slots = 54 seeds, range **405001–405054**. VERIFIED clean 2026-10-30
  (zero exact tokens repo-wide). Spend 12 mains (2 arms × 6 histories);
  other 42 slots reserved-excluded, never spendable elsewhere.
- Caps: ≤300 exec (12 used), ≤20e9 ops, ≤3600s wall. Single attempt;
  crash-resume only with dual provenance; no second attempt under V1.

## GO bars (conjunctive, fail-closed)

- G1 integrity: 12/12 mains complete; ledger exact (12×1792×24);
  `redone` empty; endpoints carry survivors + birth totals.
- G2 config audit: per-row transmission mode matches arm; all birth counts
  integer ≥ 0; maternal-copy count recorded (fallback count reported).
- G3 effect: inherited total − control total ≥ +6 births → GO
  ("vertical transmission lifts lineage productivity"; scale: V1 rate
  ~2/main, so +6 over 6 mains ≈ +50% lift). Both zero → INCOMPLETE-
  NOBIRTHS ("no matings to inherit through — mechanism untestable, not
  falsified"). Otherwise → NOGO ("transmission does not lift productivity").
  Pre-registered: the enablement reading (control zero + inherited >0)
  counts as GO, not as a special case.
- G4 descriptive: per-arm levels/survivors, max generation reached
  (lineage depth — informs follow-ups, does not gate), birth contexts.
- G5 fixtures (gate): 5 — scorer branches (GO/NOGO/INCOMPLETE/INVALID);
  bank + union-exclusion; inheritance plumbing unit (synthetic mother →
  copy vs zero by flag; fallback path); null-default bit-identity short
  run; full triage clean.
- Verdict GO ⟺ G1∧G2∧G3. No population-viability claim (births ≠
  established lineage), no RSI claim. GO licenses proposing V1c
  (mutation + selection on transmitted variation) — never executing here.
