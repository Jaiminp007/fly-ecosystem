# Birth-feasibility probe plan V1 (gates M2-lineage + M5)

Frozen 2026-10-29. Status: DESIGN ONLY until implementation + execution.
Single authorized micro-run: 4 mains, zero probes (≈1e9 ops, trivial vs caps).
Question: can births happen AT ALL in this harness/ecology? Everything
population-related (M2-lineage reading, M5, M-POP V1b) is blocked on the answer.

## Rationale (read-only, verified)

M-POP-1 Stage-0: 0 births on history-0 triple (all 3 arms). Engine requires
per birth: female energy ≥65 + mature mate nearby + action[3] > 0, children
spawn at energy 48 (below threshold — must forage up). Founders spawn AT 65
and lose energy on average (thrash-and-starve, ledgered). Unknown: does ANY
fly EVER reach a birth-qualifying state, or is the ecology structurally
sterile? No spent bank can answer (all prior mains ran reproduction:false
by design; the 3 M-POP mains are the only reproduction-ON data in history).

## Design (minimal, no new engine code)

- Fresh mini-bank 395001–395018 (2 histories × 9 seeds), union-excluded,
  fixture-seeds file post-build (V1c ordering).
- Grid: 2 histories × 2 founder-counts {24 (standard), 8 (low-competition:
  fewer mouths → easier per-capita surplus)} × candidate arm only (if the
  best survivors cannot breed, nothing can; unlearned dies fastest — no
  signal lost). BT_TICKS=1792, N-body, BT ecology. Zero probes.
- Collector (dev-script only, recording-emit proven neutral): per-tick MAX
  `own.energy` across alive founders + global max + fraction of ticks with
  max ≥ 65. This separates the two failure modes WITHOUT new runs:
  (a) energy never reaches 65 → ENERGETIC infeasibility;
  (b) energy reaches 65+ but zero births → MATING/BEHAVIORAL bottleneck
  (proximity, action[3], cooldown, sex ratio).
- No engine changes (reproduction flag already shipped + triaged under
  M-POP-1). No probes, no anchors saved (nothing to retain).

## Bars (conjunctive where stated; single decision at the end)

- G1 integrity: all 4 mains complete in caps (228-tick... no: ≤20e9 ops,
  ≤3600s wall, per-row caps); join not applicable (no join — direct emit
  read). Any crash → INVALID (fix under V1a or close).
- DECISION (one of three, published whichever fires):
  (i) ≥1 birth anywhere → FEASIBLE (+ the working condition if patterned:
  e.g., only founders-8, or only history-X — reported, not chased);
  M-POP V1b authorized for proposal (new frozen plan, fresh bank, the
  max-energy + mating readouts carried forward as design inputs).
  (ii) 0 births AND max-energy never ≥65 → INFEASIBLE-ENERGETIC: close the
  population track as structurally sterile in this substrate (publish the
  ceiling: max observed energy vs the 65 threshold).
  (iii) 0 births DESPITE energy ≥65 ticks → INFEASIBLE-BEHAVIORAL: close the
  track (mating never completes); note the bottleneck class for the record.
- No rescoring (single scorer, frozen formula). No second attempt. No V1b
  hidden inside this plan: V1b needs its own freeze + fresh goal.
