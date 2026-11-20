# LEFT-TAIL AUDIT V1: the worst case is childlessness, not death

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json endpoints per
seed x arm (births, survivors, energy/founder) + turn-gated
dev-results.json per-seed gaps (train/transferred).
Executes R178 queued item (report left-tail quantiles alongside
means). n per arm small (5-18 seeds): sorted min/med/max + zero
fraction, no smoothing, no model.

## Findings

1. **Births fail; survival doesn't.** Zero-birth seeds (f0=1.00)
   in exactly the dead arms (act both, dense both, energy-bar65)
   — everywhere else f0=0.00 (every seed births at least once).
   Zero-survivor runs: NONE (f0=0.00 in all 52 arm-distributions;
   min survivors 7–8). The dismal left tail is STERILITY, not
   EXTINCTION: founders persist childless (energy −56 to −62)
   rather than dying out. The program's worst case was
   mis-specified (R178 said "extinction runs" — none exist;
   "zero-birth arms" — those exist, and only those).
2. **Energy tails are uniformly negative.** Best seed-arm maxima
   (−8.7 spread-attract, −13.0 spread1) never reach zero; worst
   minima (−62.6 inherit-zeroed) sit near the starting endowment
   fully spent. No arm, no seed, breaks even — the left tail and
   the right tail are both red; the mean (−20 to −60) was never
   hiding a surplus. Post-scarcity (R176 assay condition) has
   nowhere been observed.
3. **Training is reliable; transfer is seed-luck.** Train gaps
   tight across all 10 banks (per-bank min/med/max within
   0.808–0.833 — training NEVER fails badly). Transferred gaps
   wide (worst-seed 0.374 (attempt-06) to 0.572 (attempt-09);
   best-seed up to 0.829). Worst-seed transfer never fully fails
   (>0.37 everywhere — above unlearned flat) but the spread
   (worst-to-best ~0.2–0.4 per bank) dwarfs the mean tax
   (0.15–0.31). The dismal arithmetic of transfer: deploy the
   mean, meet the worst seed.
4. **Dead arms die identically across seeds.** act/dense/energy-
   bar65: births 0/0/0 in EVERY seed (f0=1.00, no variance at
   all) with survivors 7–18 (living on, childless). Deterministic
   sterility — the bar/patch kills reproduction with certainty
   while leaving survival to chance. The Malthusian positive
   check (R182) operates without variance: certain, not risky.

## Verdict (measurement — R178 queued item EXECUTED)

- **LICENSED:** sterility-not-extinction as the dismal shape
  (52/52 arm-distributions); training-tight/transfer-wide as
  the reliability asymmetry (10/10 banks); deterministic
  sterility in dead arms (4 arms, all seeds zero).
- **CORRECTED:** R178's "extinction runs" (none exist).
- Standing rule (from R178, now with numbers): every future
  verdict with per-seed tables reports min/med/max alongside
  means — cheap, no new worlds, this audit as the template.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
