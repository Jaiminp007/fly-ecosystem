# RSI-TRANSFER V1b verdict (2026-11-03) — NOGO (unlearned wins births and energy)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 5G before and
after; output 1.2M). Frozen plan `docs/RSI_TRANSFER_PLAN_V1B.md`. New
contrast (loop-proposed change + births-transfer eval — V1 tested energy,
mate lines never transplanted). Fixtures 12/12 green pre-run (zero
worlds); bank 473118–473153 minted post-fixtures. Single attempt, no
rescoring (V1 stands).

## Gate fix disclosed (packaging, zero mechanism change)
First scoring returned INVALID: G1 demanded 4 phaseRows per train, but
the unlearned 473118 train went clean-extinct (survivors 24→24→6→0,
deaths 24/24, births 0 — valid outcome, not a crash; crashes cannot
reach scoring). G1 amended to accept clean extinction
(`trainRowComplete`: 4 rows OR survivors==0 with founders accounted),
+ fixture (synthetic extinction/crash cases), 12/12 green; verdict
recomputed via resume with zero new mains (all rows skipped, redone
empty). Same class as V1's probe-rate fix.

## Results, pairs (473118→473127, 473136→473145), G1+G2 pass, 29 adopts
Train adopted rates differed by history (1.0 and 2.0) — the loop's change
did vary as hoped. Transfer probes (mating on, bar 50 + nutrient 5):
- Births: selfmod 3 (1+2) vs fixed 5 (1+4) vs unlearned **14** (8+6,
  incl. the only gen-2).
- Energy: selfmod −48.7 vs fixed −44.6 vs unlearned **−24.9**.
- Verdict: **RSI-TRANSFER-NOGO-V1B** — selfmod beats neither control.
- Texture: loop adoptions HURT vs plain learning here (fixed > selfmod
  on both births and energy — selection-harmful echo of V1b, now under
  transfer); never-learning wins everywhere again. The extinct
  unlearned-train founders' transplanted init weights produced 8 births
  + a gen-2 on transfer: init weights + fresh probe learning dominate;
  train-phase learning (any rate) is baggage.

## Reading
The births-transfer eval — the friendliest venue found (mate-selection
proved learned edges reproduce) — still belongs to the never-learner by
a wide margin (14 vs 3/5). A self-proposed rate change does not transfer
reproductively at this scale, and plain learning beats loop-guided
learning on both metrics. The product gap stands with transfer evidence
from two eval families now (energy V1, births V1b). No successive-
revision/RSI/retention/population claim. Cross-codebook transfer stays
unlicensed; no further loop-transfer contrasts licensed on this bar.

## Preservation
`evidence/rsi-transfer-dev/fresh-02/` (bank, now spent) +
`evidence/rsi-transfer-dev/attempt-02/` (untracked raw evidence, 1.2M).
