# GEN1_BICARRY V1 verdict (2026-11-04) — GO (recombination survives foreign-task interference; the matrix is complete)

## Authorization
Program-level user authorization under standing discipline; frozen
plan `docs/GEN1_BICARRY_PLAN_V1.md` (ERODE2 bar family, per-pair:
pre-gap > +0.002 both then retention fraction ≥ 0.50 both).
Fixtures 7/7 green pre-run (zero worlds); triage full pipeline on
throwaway 490649–490657 (digests move + mixed placement verified +
crossover 10/10 + matchedN 10 + full BC gauntlet + post probes
complete) BEFORE bank mint. Bank 475477–475494 minted post-triage,
verified clean (`475477`, `475486` heads). Single attempt (30 runs),
as measured. No rescoring. Last cell of the mode×interference
matrix — not a re-run of SOCCARRY (different channel), ERODE2/3
(maternal), BIHOME (return), or BIPARWIN (no gauntlet).

## Results (pairs 475477, 475486; per-pair, both required, frozen rule)
A/B-content PASSES; skill genuine. Colonies birth 23+23+21 pooled.
All 30 runs complete. No floor (all arms ≥ 4).
- Birth pre-gaps (bi−naive): +0.0022 / +0.0090 — both clear +0.002
  (pair 1 thin, holds).
- Post-gaps: +0.0060 / +0.0056.
- Retention fractions: **2.78 / 0.62** — BOTH ≥ 0.50.
- → **GO** (`GEN1-BICARRY-GO-V1`).
- Copy descriptive frac 1.45 (fourth replication of maternal
  gauntlet-survival: 1.0/1.43/1.03/1.45).

## Reading
Recombination joins maternal copying on the interference-surviving
side: the mode×interference matrix is complete — maternal 1.0/1.43/
1.03/1.45 (four banks), biparental 2.78/0.62, social 0.90/0.46. The
split is structural, not dose-shaped: exact averaging (maternal) and
crossover recombination both preserve skill through two foreign
tasks, while success-biased copying erodes on one pair per bank.
Crossover mixes parental weights rather than collapsing onto one
source (copybest NOGO) or chasing recent winners (social NOGO) —
the rules that keep variation survive interference; the rules that
concentrate onto a single source do not. Combined with the natal
results (bipar 7/7, maternal law-adjacent, social 8/8) and return
results (all dissolve), the full transmission picture reads: birth
inheritance works by every engine rule, interference filters
concentrating rules, immersion dissolves everything. Line closed as
scored.

## Preservation
`evidence/gen1-bicarry-dev/fresh-82/` (bank, now spent) +
`evidence/gen1-bicarry-dev/attempt-01/` (untracked raw evidence,
~1.4M, 30 rows with mixed-founder + biparental + BC-gauntlet
provenance).

## Registry repair (disclosed)
While building this line, a latent corruption was found in the
`SPENT_RANGES` registry inherited from the SOCCARRY clone: the range
append had consumed one bracket, nesting `[474829,474846]` inside
`[474811,...` (`flatMap` silently dropped 18 seeds from exclusion —
valid JS, wrong registry). No verdict is affected (the dropped seeds
were never re-minted; every bank's own whole-token clean-checks
passed). Repaired in both `scripts/gen1-soccarry-dev.mjs` (end
bracket rebalanced) and `scripts/gen1-bicarry-dev.mjs`, verified
functionally (`BIC_SPENT_SEEDS` 6481 entries, 474829 and 475459
excluded, 475477 free). This commit includes the soccarry repair.
