# GEN1-CLEAN V1 verdict (2026-11-04) — NOGO with partial rescue

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output ~1M). Frozen plan `docs/GEN1_CLEAN_PLAN_V1.md`. New
instrument (same-seed toxin-free codebook: all valences +1, same
bits/ids/geometry). Fixtures 6/6 green pre-run (zero worlds; two laziness
repairs pre-run — double-wrapped test helper + arm-prefix rename — zero
mechanism impact); triage on throwaway 490082–490090 (exact ZERO toxin
on all 24 agents over 256 ticks + completion — swap verified). Bank
474343–474360 minted post-triage, verified clean. Single attempt, as
measured. No rescoring.

## Results (pairs 474343, 474352; frozen naive, 48 energy)
Manipulation check PASSES: fresh-clean toxin exactly 0.00 both pairs
(swap verified — no toxin intake at all). Survival: fresh-clean 0.729
(0.875, 0.583) vs deep-toxic 0.958 (0.958, 0.958). Rescue bar
(fresh ≥ deep×0.9 = 0.862): 0.729 < 0.862 → **NOGO**
(`GEN1-CLEAN-NOGO-V1`). Fresh-clean runs complete the full 1792
(not extinct, unlike fresh-toxic ~1400–1600); deep truncated at 768 by
auto-finish (censored high — conservative direction, NOGO stands).
Causes not captured (rows lack per-agent/death ledgers — plan-vs-
implementation gap, disclosed; would need agent tables to separate
starvation-vs-lifespan among the zero-toxin deaths).

## Reading (no rescue — but a large partial lift)
- Against the historical fresh-toxic zero (0.0 survival, 4/4 runs,
  placed V1 + drain V1 — cross-bank, descriptive not scored): removing
  ALL toxin intake lifts fresh survival 0.0 → 0.73. Toxins are
  responsible for MOST of the fresh death (the 0.8/tick forced-feed
  drain — engine mechanism confirmed). But NOT all: clean-fresh still
  dies ~27% with zero toxin, well below deep (0.96).
- So BOTH stories operate: threshold-toxin explains the bulk (toxin
  necessary for most deaths) AND a non-toxin world effect remains
  (boom-bust feast-crash, density, or costs — fresh geometry is worse
  even with safe food). The frozen binary (rescue-or-not) scores NOGO;
  the graded datum is partial rescue. Neither simple story alone fits.
- Next discrimination (not licensed here — would need a fresh low-
  density or paced-intake arm, or per-agent cause tables on clean):
  whether the residual ~27% is boom-bust starvation (feast then crash)
  or another cost. Line closed as scored.
- No transmission/transfer/RSI/population claim.
## Preservation
`evidence/gen1-clean-dev/fresh-20/` (bank, now spent) +
`evidence/gen1-clean-dev/attempt-01/` (untracked raw evidence, ~1M;
per-agent toxin sums + binned energy curves).
