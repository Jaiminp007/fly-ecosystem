# M-POP Plan V2 — bar-50 feasibility re-test + full Phase A if feasible (DESIGN ONLY)

Status: FROZEN 2026-11-02. No code, no worlds, no bank build under this doc.
Next: implement under this plan (fixtures + triage + bank), then the single
authorized attempt. Closes either way. LAUNCH NOTE: Track B requires a fresh
/goal prompt per `docs/VISION_TRACKA_STATUS.md` — this freeze is the plan
such a goal would execute, not the execution itself.

## New rationale (why a closed line reopens — required, stated)

M-POP V1+V1a CLOSED on bar-65 infeasibility (0 births, energies −56..−64).
That premise is STALE: MATE-ENERGY (bar50 unlocks 8 births vs 0, same
gate), MATE-ENCOUNTER (hub births 35v25), MATE-PROXIMITY (up to 49),
MATE-FOOD (enriched 27 vs 12) all postdate the closure. The closure
reason — not the discipline — expired. Reopening is licensed on new
evidence + new bank + same frozen discipline (never on re-reading V1).

## Design (V1a-verbatim except ONE knob)

- Grid: V1a's 3 arms (candidate learns always / frozen learns phase A
  only / unlearned never learns) × 6 histories = 18 mains max, 0 probes.
- ONE knob change: `matingEnergyBar` 65 → **50, HELD** from MATE-ENERGY
  bar50 (the value that unlocked births — not tuned, not swept).
  Everything else V1a-verbatim (syncNewbornLearners engine already
  implemented + fixtures green; standing variation only, no mutation,
  no weight inheritance — still SELECTION, not Lamarckism).
- Stage 0 (feasibility, INSIDE the single attempt): history-1 triple;
  total births ≥ 1 across the triple or INVALID-FEASIBLE (fail-closed,
  publish partials, halt at 3 mains, bank preserved).
- Stage 1 (only if Stage 0 passes): remaining 5 histories × 3 arms.

## Conjunctive bars (GO iff all pass; any fail → line CLOSED, no Phase Q)

- G1 feasibility: ≥1 birth in Stage 0 (else INVALID-FEASIBLE).
- G2 lineage persistence: fraction of founder lines with ≥1 living
  descendant at end, candidate MINUS unlearned ≥ +0.15 (V1a bar).
- G3 depth OR breadth: mean living descendants/line candidate − unlearned
  ≥ +1.0, OR max generation candidate > unlearned (pre-registered OR).
- G4 caps held. G5: fixtures green BEFORE any world (bank build via
  module import; scorer unit incl. ties/empties; null-default
  re-verified (reproduction:false default bit-identical); full suite at
  shifted-pre-existing baseline only).
- Verdict: GO licenses Phase B (social/cooperation extension) under a
  frozen plan — NEVER an in-place expansion. NOGO/INVALID closes the line.

## Bank (fresh, build AFTER fixtures pass)

`evidence/m-pop-dev/fresh-02/`: deterministic 445001–445054 (6 histories
× 9) + fixture-seeds-01.json post-build. Verified clean 2026-11-02
(0 seed-key hits in 445000–445100 across all evidence JSON; 0 mentions
in docs/scripts/learning/tests; build-time guard re-verifies against the
grown exclusion set incl. 444001–444054 + fresh-01 + fixture seeds).
Caps: ≤300 exec (18 used) / ≤20e9 ops / ≤3600s / ≤200MB. Single
authorized attempt; crash-resume with dual provenance only. No qual/
reserve contact; no bank reuse/regeneration; no rescoring; no RSI claims
(lineage selection ≠ agent self-modification — the Vision distinction
stands, restated).
