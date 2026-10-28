# RSI v33 search: evict × skip — A-WON (+1.02), claimant (1,0.15) → Gen19

## v35 bank (`005fc0c6…`): pair beats an A-false bar, A-direction leads

Baseline Gen1 R=4: 7.05 A-FALSE (0.9/1.154) B-True — fourth A-false bank.

| cell | (b,τ) | proc | score | vs bar | A | B |
|---|---|---|---|---|---|---|
| a35-e1s015 | (1,0.15) | A | 8.065 | +1.02 | True | True |
| a35-e1s03 | (1,0.3) | A | 7.996 | +0.95 | True | True |
| b35-e1s05 | (1,0.5) | B | 7.996 | +0.95 | True (twin) | True |
| b35-e1s005 | (1,0.05) | B | 7.976 | +0.93 | False | True |

B menu draw mulberry32(20261127) → ['(1,0.5)','(1,0.05)'] (skip-alone
ablation stayed out — redundancy question unanswered numerically).
b35-e1s05 ≡ a35-e1s03 bit-identical (seq 5.98 vsR 2.016) — fourth
plateau twin. Adjudication by best cell: A-best 8.065 > B-best 7.996
→ A-WON (+0.07, thin but directed — first A-won search since V20).

Redundant vs complementary (V33 motivation): cross-bank keep-hard-alone
+2.16 vs within-bank pair +1.02 is incomparable (different banks); no
within-bank (1,0) or (0,τ) cell exists. V34 asks exactly this.

Claimant a35-e1s015 → Gen19 fresh eval. 80 worlds. Cumulative 4824
(4744 + 80).
