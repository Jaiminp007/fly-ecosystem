# RSI Gen11 fresh eval — S=3 x R=4 — REJECT

> CORRECTION (2026-11-13): gate-(1) readings in the first version of this
> doc were a parsing artifact. True gate 1: seq +5.274 8/8 PASS (see
> `docs/RSI_FRESH_EVAL_CORRECTION.md`). Verdict stands on gate 5 alone.

Claimant: `b17-s3` (dual-true on v17 by +0.001 on B, +1.25 over the
same-bank R=4 baseline, retention-first line). Bank
`evidence/rsi-taste-v1/gen11-eval-20261110-v1/`
(bankSha `99dbcb30…`), 8 histories x 6 arms = 48 worlds, one frozen
attempt, Gen1 R=4 flags + `--replay-strata 3`.

## Gates v2

1. vs unlearned: mean EXACTLY 0.0 (5.274 both, 8/8 identical) — FAIL.
2. vs frozen-after-A: +1.53 (5.274 vs 3.745) — PASS.
3. vs reset: +4.37, reset 7/8 — PASS.
4. skills: aSkill 1.31 8/8, bSkill 1.10 7/8, bAcq 0.67 7/8 — PASS.
5. retention: aRetention −0.05 4/8 / bRetention −0.06 4/8, both legs
   descriptively negative — FAIL (the v17 B-hold by +0.001 did not
   generalize; strata upweighting starved both legs fresh, as the V16
   prediction's mechanism warned).
6. transferReset: 0.0 exactly — PASS (tie).
7. integrity asserts held — PASS.

Verdict: **REJECT** on gate (5) (aR −0.052 / bR −0.064, both
negative). Gate 1 was +5.274 8/8 PASS (corrected — no exact-zero).
Successive 0/2 in the strata line. No RSI. All prior failures stand.

## Control: R=4-alone S=1 on the same gen11 bank (24 worlds)

`gen11-eval-20261110-v1/r4-control`: seq **+5.1327** 8/8 surv +82. Fifth
same-bank control proving silencing (gen8 +4.43, gen9 +5.19, gen10 +4.49,
gen11 +5.13): the base crosses thresholds on every fresh bank tried
(5/5 positive: +5.41, +4.43, +5.19, +4.49, +5.13); EVERY mixture-touching
revision (surprise, slots, ratio, scale, strata) collapses behavior to
prior-identical (exact 0.0) while probes confirm the weights still change.
The passing configuration is singular; the failure mode is universal
across revision classes.
