# ODOR DEV ROUND 7 PLAN V1 — FROZEN 2026-11-02 (slow-phase acquisition)

Status: FROZEN. Authorizes exactly one implementation matching this
plan verbatim, fixtures, triage (read-only round-1 reuse check), and
single execution on the SAME 8 reused histories EXTENDED to 3584
ticks (same seeds, longer runs — bank unchanged per R7 scoping item
5 ruling; execution is new and hereby singly authorized). No second
run, no tuning, no qual claim. Zero worlds spent by this freeze.
Parent: ROUND7 SCOPING V1 (all 5 items closed).

## 1. Design (single-variable vs R1-learned: TIME only)

- Curriculum: proportional doubling A1024–B1024–C1024–D512 = 3584
  ticks (same shape, twice as long; boundaries 1024/2048/3072).
  No rehearsal table, no phase reweighting.
- Arm: R1-plain learned (original 8-dim head — the only positive-
  transfer arm; gated/mixture heads excluded as confounded).
- No instrument change: the experiment already supports custom
  phaseDurations (R2 precedent); no new modules, no new flags.
  The only code is the R7 runner (phase table + 3584 ticks +
  doubled anchors) plus fixtures. Null-default: all legacy paths
  bit-identical.

## 2. Arms and probes (8 reused histories, extended)

- Acquisition (ONE new arm): learned-extended (continuous regime,
  doubled curriculum).
- Reused read-only: R1-learned 1792-tick rows (THE comparator:
  short-self), frozen, reset, native, guarded, native-full rows.
- Probes: A/B earlier-current-reset + transfer 5 modes from the
  extended D anchor (same seeds, same 256 probe ticks, same scorer
  code path as rounds 1–6).

## 3. Caps

KEEP 40e9 ops / 3600s wall (verified: R1 actuals 35.66e9 with
~2.4e9/arm acquisition; R7 ≈ R5 probe load + 2× acquisition ≈
29.5e9; margin 1.36×, same basis as R2–R6).

## 4. Fixtures (all green before execution)

Anchor keys at doubled boundaries (A1@1024/B1@2048/C1@3072/
D1@3584); acquisitionTicks 3584 constant; billing identity at new
length (module formulas unchanged, ticks doubled); no-new-seeds
(same 8, extended in place); scorer reuse (same gates code path).

## 5. Verdict (frozen)

Primary comparator: short-self (3584-tick rows vs 1792-tick R1
rows on the same histories).
- GO iff transfer gate (6/8 + mean>0 vs short-self AND vs cheap
  native-full, nonnegative survivor diffs) AND A≥95% AND B≥95%.
- PARTIAL iff transfer gate vs native-full + A/B pass but the
  short-self gate fails (works; time-neutral).
- Else NO-GO.
Falsifier attachment (scoping, frozen): the vs-short-self
comparison + late-half energy slope decide the calendar proviso —
lift (or plateau, slope ≥ 0) → proviso SURVIVES (six NO-GOs were
fast-phase artifacts; lane re-aims at slow phase); no lift AND
still declining → proviso VOIDED as a capability verdict (six
NO-GOs stand as capability, proviso deleted). Plateau/lift are
reported in all verdicts.
- Descriptive dev verdicts in all cases. A GO triggers
  qual-freeze consideration (iv-b) — authorizes nothing further.
