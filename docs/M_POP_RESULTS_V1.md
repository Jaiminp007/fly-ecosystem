# M-POP results — Phase-A Stage 0 (INVALID-FEASIBLE, line CLOSED)

Frozen plan: `docs/M_POP_PLAN_V1.md` + V1a. Single authorized attempt.
Verdict: **INVALID-FEASIBLE — zero births on the history-0 triple (all 3
arms run to completion)**. Line closed WITHOUT spending the bank (3 of 18
mains run; 51 seeds untouched). No Phase B, no qual spent.

## Execution record (exactly per plan)

- One crashed pre-invocation (missing `checkMainIntegrity` helper — script
  bug, zero ledgered, zero saved; disclosed per D1/M-GATE precedent),
  output dir wiped clean, single fresh run after the one-line fix.
- Stage 0: history 388001 × {candidate, unlearned, frozen} = 3 mains,
  1792 ticks each, reproduction enabled (verified wired: constructor flag →
  World config). Ledger: 3 mains / 0 probes / 5376 ticks / 129024 slots /
  475688579 ops — all within caps.
- Totals births: 0, 0, 0. Gate (≥1 to proceed) NOT met → INVALID-FEASIBLE
  written with dual provenance, attempt stopped before history 2.
- Cumulative: 7396 + 3 ledgered (+1 phantom crashed main, unledgered).

## What the triple shows (read-only, ledgered rows)

- Survivors: candidate 17 / frozen 10 / unlearned 3 (of 24 founders).
  Nobody reaches the birth threshold (energy ≥ 65 + mature mate + act):
  endpoint energies −56 to −64 per founder; mass death even in the learning
  arm. This is M-ORIGIN's thrash-and-starve pattern WITH reproduction on —
  the ecology starves founders before any lineage can start.
- The instrument worked as designed: sync helper never fired (no newborns
  to create — correct no-op, not a silent skip); reproduction flag verified
  plumbed end-to-end (constructor → World config); no crashes, no
  integrity violations, triage green pre-run.

## What this closes, and what it leaves open

CLOSED: M-POP-1 as frozen (lineage retention needs lineages; there are none
to select among — the feasibility gate did exactly its job, failing fast
and cheap instead of spending 15 more childless mains).
OPEN (not authorized here — needs its own frozen plan + fresh seeds):
whether ANY ecology/tick-budget in this engine yields births at all
(the pilot that would precede any population work). The ledgered endpoints
cannot answer it (no per-tick individual-energy traces were recorded —
deliberately, per the zero-emit design; a pilot would need them).
