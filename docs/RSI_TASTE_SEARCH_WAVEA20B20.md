# RSI v20 search: second-successive combination μ=0.5 x tr=0.3 (v21 bank)

Bank `evidence/rsi-taste-v1/search-20261114-v21/protocol.json`
(bankSha `cd7c8698…`), Gen1 R=4 flags + (32,8) S=1, both dials on every
revision cell, ≤96 worlds/procedure, matched A/B. Rationale + productivity
window in `docs/RSI_TASTE_PLAN_AMENDMENT_V20.md`.

## Cells

| cell | (μ, tr) | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (base) | (0, 1.0) | 5.566 | 5.372 | +0.195 | 1.531 vs 1.212 True | 1.143 vs 1.260 False |
| a21-combo | (0.5, 0.3) | 6.439 | 4.775 | +1.664 | 2.036 vs 1.874 True | 1.282 vs 1.144 True |
| a21-m05t02 | (0.5, 0.2) | 5.014 | 3.787 | +1.227 | 1.066 vs 1.106 True | 0.945 vs 0.642 True |
| b21-m03t03 | (0.3, 0.3) | 3.284 | 3.779 | −0.495 | 1.515 vs 1.659 False | 1.367 vs 1.292 True |
| b21-m07t03 | (0.7, 0.3) | 4.542 | 3.999 | +0.543 | 1.641 vs 1.988 False | 0.921 vs 1.154 False |

The combination is the first stack that does NOT attenuate below base:
6.439 dual-true, +0.87 over the same-bank baseline, with the strongest
search A-margin (+0.16 on a high base) of any claimant. A-directed for
the first time in the program (B-random supplied Gen8–Gen14 claimants).
μ≠0.5 breaks A at tr=0.3 in both B-cells — μ=0.5 is a point, not a
plateau.

## Claimant

`a21-combo` → fresh-evaluated as Gen15 (`docs/RSI_TASTE_GEN15_EVAL.md`,
REJECT on gate 5 — both retentions negative, A-probe surv −8; lifetime
+3.89 held). A-wins-V20 satisfies productivity-window condition (i);
the failed accept closes this window — the next attempt must open a new
gen-1.

Round worlds: 80 search + 48 eval + 24 control = 152. Cumulative 3552.
