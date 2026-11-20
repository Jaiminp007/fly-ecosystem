# CODEBOOK PHYLOGENY V1: star confirmed; revaluation (not recoding) predicts the tax

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
204 codebooks dumped via the repo's own `makeCueCodebook` (scripts/dump-codebooks.mjs);
distances computed in scripts/codebook-phylogeny.py.
Pre-registered metric: per cue-id key (family, valence); d_total/d_family/d_revalue
= fraction of 16 ids differing in key / family / valence-with-same-family.

## Test A: star phylogeny — CONFIRMED (R111)

Within-bank median d_total 0.8125 (498 pairs) vs across-bank 0.8750 (20,208
pairs): Δ = 1 id in 16 — near-star. Histories are structurally independent
draws; the jury audit's independence assumption now holds structurally as
well as statistically (κ≈0). The 1-id whisper (slightly nearer within banks)
is noted, not chased (sequential-seed RNG texture, untested by design).

## Test B: ecology-side clock — SR-naive refuted on sign, revaluation wins

27 transfer pairs: all codebooks far apart (d_total 0.688–0.938) yet transfer
gaps 0.374–0.796 — transfer routinely survives ~80% codebook mismatch
(finding in itself: policies latch onto surviving regularities).

- corr(d_total, tax) = +0.20 (weak).
- corr(d_family, tax) = −0.18 (WRONG SIGN for the naive SR port: recoding
  does not predict the tax).
- corr(d_revalue, tax) = +0.47 (moderate, n=27): valence flips predict the tax.

## Verdict (measurement — distinction, not instrument)

- **REFINED (replaces SR-naive):** for policy-transfer agents (not SR
  agents), revaluation is the dangerous change and recoding the merely
  expensive one — wrong-answers vs non-answers. Flipped valences turn old
  avoidance into food-avoidance (directly punished); new patterns merely
  force relearning (bounded cost). The BH-inversion cascade (valence as
  the live wire) is the same lesson for the third time.
- **LICENSED:** star independence (jury audit grounded); transferability
  lives in the ecology-side decomposition (revalue share), joining the
  pair-property account (TRANSFER_CLOCK: train side constant).
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
