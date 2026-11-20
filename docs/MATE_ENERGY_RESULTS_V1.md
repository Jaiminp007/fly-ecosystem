# MATE-ENERGY results — Phase V1 GO (first births in program history)

Frozen: `docs/MATE_ENERGY_PLAN_V1.md`. Single authorized attempt: 8 mains
(2 arms × 4 histories, fresh bank 404001–404036), 0 probes. One crash
mid-run (newborn tick-alignment, previously untested path — first birth
ever observed crashed the harness); null-default 2-line fix with
regression test + full triage clean; RESUMED (not restarted) with
dual provenance (executionSources = pre-fix, scoringSources = post-fix).
`redone` lists exactly the 4 re-executed bar50 mains; bar65 rows untouched.

## Verdict: MATE-ENERGY-GO [bar50 only — energy bar was the blocker]

- G1 integrity ✓: 8/8 mains complete; ledger exact
  (8/0/14336/344064/1.35e9).
- G2 audit ✓: all rows carry the correct bar + decoupled flag; all birth
  counts integer ≥ 0.
- G3 outcome: bar65 total = 0 (structural block replicates on a fresh
  bank); bar50 total = **8** (3/1/4/0 across histories) → GO, exactly the
  pre-registered branch: "energy bar was the blocker — as predicted."
- The crash IS the mechanism working: the run died on its first-ever
  birth because no prior line had ever exercised newborn-learner creation.
  The fix aligns newborn tick/counters at creation; verified null-default
  (identical rerun behavior where no births occur + unchanged triage).

## What this decides

1. FIRST BIRTHS in program history (M-POP 0, feasibility 0, MATE-ACT 0,
   MATE-DENSE 0 → 8). The spawn anti-qualification diagnosis was correct:
   founders spawn AT the 65 bar and mature below it; lowering to 50 opens
   a real mating window.
2. Energy overlap, not encounter rate alone, was binding: same density,
   same gate, only the threshold changed (both arms N=24, identical
   otherwise — cleanest ablation in the track).
3. Newborns integrate and the colony continues (bar50/404001: 8 survivors,
   level −59.3 normal, 3 births) — the machinery works end to end.
4. NOT claimed: no lineage/inheritance (newborns get zeroed weights —
   documented gap, next line), no population viability, no RSI.

## Licensed follow-up (proposed, not started)

V1b: vertical transmission (parental slow weights → newborns ± mutation)
under the SAME bar-50 gate — tests whether births can carry information,
the actual requirement for selection. Fresh plan + fresh bank required.

## Cumulative: 7507 + 8 = 7515 (all ledgered, zero duplicates)
