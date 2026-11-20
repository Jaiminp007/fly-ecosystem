# MATE-DECOMP V1 verdict (2026-11-03) — GO (edge is all taste)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output 1.3M). Frozen plan `docs/MATE_DECOMP_PLAN_V1.md`. New
question (taste-vs-motor decomposition — never asked; the edge's driver
was unknown). Fixtures 5/5 green pre-run (zero worlds); bank 473190–
473207 minted post-fixtures. Single attempt, as measured.

## Results, histories 473190/473199 (6 mains / 0 probes, G1+G2 pass)
Line births (transmission none, bar 50 + nutrient 5.0):
- candidate (taste+motor learn): 4 + 10 = 14 (gen-2: 0 + 2).
- noTaste (motor-only): 3 + 3 = 6 (gen-2: 0).
- unlearned (nothing): 5 + 3 = 8 (gen-2: 0).
- Verdict: **MATE-DECOMP-GO-V1** — candidate 14 > unlearned 8.
- Attribution (descriptive): taste-share **1.33**, motor-share **−0.33**.
  Motor learning isolated does NOT help (6 < 8); taste learning drives
  the entire edge and then some (candidate−noTaste = 8 > total edge 6).
- First gen-2s in the selection line with zeroed transmission (2,
  candidate history 473199) — gen-1 (zeroed, learning) reproduced.

## Reading (stated thin)
The reproductive edge is foraging skill, not movement skill: TasteEnergy
weights (food values → energy surplus → energy-gated mating) carry it;
actor-critic steering adds nothing (slightly negative in isolation —
possibly exploration costs without taste guidance to pay them back).
This locates the M2-vehicle's fuel precisely: transmitted/learned food
valuation, not locomotion. No population/learning/RSI/retention claim
beyond the licensed next step. Next: replication under its own frozen
plan — not started.

## Preservation
`evidence/mate-decomp-dev/fresh-01/` (bank, now spent) +
`evidence/mate-decomp-dev/attempt-01/` (untracked raw evidence, 1.3M).
