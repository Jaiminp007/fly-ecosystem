# RSI Gen15 fresh eval — combination μ=0.5 x tr=0.3 — REJECT (gate 5)

Claimant: `a21-combo` (dual-true 6.439, +0.87 over baseline, first
A-directed claimant since Gen6). Bank
`evidence/rsi-taste-v1/gen15-eval-20261114-v1/` (bankSha `a318fee2…`),
8 x 6 arms = 48 worlds, one frozen attempt, Gen1 flags +
`--taste-rate 0.3 --motor-consolidation-rate 0.5 --replay-passes 4`.
Parsed with the corrected parser.

## Gates v2

1. vs unlearned: +3.886 8/8 surv +62 — PASS.
2. vs frozen-after-A: +2.739 8/8 surv +42 — PASS.
3. vs reset: +0.558, 8/8 ≥ −1.00, surv +3 — PASS.
4. skills: aSkill 1.413 8/8, bSkill 1.344 8/8, bAcq 1.225 8/8 — PASS.
5. retention: aR **−0.117** 3/8 / bR **−0.226** 2/8, probe surv −8/−2 —
   FAIL (both means negative — the only eval besides Gen11 with both legs
   negative).
6. transferReset: 0.0 tie — PASS. 7. integrity — PASS.

Verdict: **REJECT** on gate (5). Combination line 0/2; μ-line returns to
0/2 (Gen12 ✓ then Gen15 ✗); retention-line (Gen13) untouched at 1/2.
No RSI.

## Control: R=4-alone greedy on the same gen15 bank (24 worlds)

seq **+4.8958** 8/8 surv +71. Ninth base-positive. Revision (+3.89)
trails base (+4.90) — attenuation once more.

## Consequence (real interaction, correctly parsed)

Each dial alone holds retention fresh (Gen12 μ: aR +0.218/bR +0.142;
Gen13 tr: aR +0.326/bR +0.111); stacked, BOTH legs go negative with
survival collapse (−8). Smoothing the motor while shrinking taste steps
jointly over-stabilizes: the policy stops re-acquiring after the B/C
shift. Stacking accepted dials is not monotone — a genuine,
correctly-measured negative result about compositionality, and exactly
the kind of second-successive evidence the program exists to collect.
Next: last virgin old-code axis (pairwise x R=4, V21).
