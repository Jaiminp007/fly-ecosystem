# RSI Gen14 fresh eval — matching x R=8 — REJECT (gate 5, survival)

Claimant: `b20-m8` (matching×R=8: dual-true on v20, +0.109 over the
same-bank greedy R=4 baseline). Bank `evidence/rsi-taste-v1/gen14-eval-20261113-v1/`
(bankSha `67dc58ee…`), 8 histories x 6 arms = 48 worlds, one frozen
attempt, Gen1 flags + `--feeding matching --replay-passes 8`.
Parsed with the corrected parser (see `docs/RSI_FRESH_EVAL_CORRECTION.md`).

## Gates v2 (correct fields)

1. vs unlearned: seq **+3.712** 8/8 surv +64 — PASS (alive, as the
   smoothness argument predicted; attenuated vs greedy base as expected).
2. vs frozen-after-A: +2.47 8/8 surv +34 — PASS.
3. vs reset: +0.58, 8/8 ≥ −1.00, surv +1 — PASS.
4. skills: aSkill 1.133 8/8, bSkill 0.689 6/8, bAcq 0.798 8/8,
   saved 1.133/0.689 > 0 — PASS.
5. retention: aR +0.176 5/8 / bR +0.358 6/8 BUT A-probe surv **−3** < −2 —
   FAIL. The threshold bypass keeps lifetime alive while bleeding
   retention survival: stochastic feeding explores away the retained
   policy's survivors.
6. transferReset: 0.0 exactly, surv 0 — PASS (tie).
7. integrity asserts held — PASS.

Verdict: **REJECT** on gate (5) (probe survival). Successive 0/2 in the
matching line. No RSI.

## Control: R=4-alone greedy on the same gen14 bank (24 worlds)

`gen14-eval-20261113-v1/r4-control`: seq **+5.5156** 8/8 surv +84.
Eighth base-positive (8/8 fresh banks). Revision (+3.71) trails base
(+5.52) — attenuation, not silencing.

## Consequence

Matching is closed as a lead (survival bleed is structural to
stochasticity) but validated as a diagnostic: lifetime CAN stay alive
off the greedy threshold, confirming the corrected attenuation picture.
The path forward is second-successive attempts on the passing dials
(Gen10/Gen12/Gen13), not new first-accept hunting — frozen as V20.
