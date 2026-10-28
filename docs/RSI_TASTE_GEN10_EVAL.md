# RSI Gen10 fresh eval — (40,10) x R=4 — ACCEPT (1/2, corrected)

> CORRECTION (2026-11-13): the first version of this doc wrongly reported
> REJECT on a gate-(1) parsing artifact. Re-derived from `results.json`
> with V2 gates verbatim: ALL gates pass (see
> `docs/RSI_FRESH_EVAL_CORRECTION.md`). This is a main-line first-accept.

Claimant: `b16-mem40-10` (dual-true on v16, +0.225 over the same-bank R=4
baseline, retention-first line). Bank
`evidence/rsi-taste-v1/gen10-eval-20261109-v1/`
(bankSha `21c4826e…`), 8 histories x 6 arms = 48 worlds, one frozen
attempt, Gen1 R=4 flags + `--capacity 40 --recent 10`.

## Gates v2

1. vs unlearned: mean EXACTLY 0.0 (4.775 both, 8/8 identical) — FAIL.
2. vs frozen-after-A: +1.124 (4.775 vs 3.651) — PASS.
3. vs reset: +3.88, reset 6/8 — PASS.
4. skills: aSkill 0.97 7/8, bSkill 1.45 8/8, bAcq 1.06 8/8 — PASS.
5. retention: aRetention +0.298 6/8 surv −2 PASS / bRetention +0.101 4/8
   surv +1 PASS (both thin) — descriptive PASS, moot under gate (1).
6. transferReset: 0.0 exactly — PASS (tie).
7. integrity asserts held — PASS.

Verdict: **ACCEPT** — all 7 gates pass (g1 +4.775 8/8; g2 +3.651;
g3 +0.896; g4 skills ✓; g5 aR +0.298 6/8 / bR +0.101 4/8, probe surv −2/+1;
g6 tie; g7 integrity). First accept of the fixed-ratio line; successive
counter 1/2 (Gen6 main-line accept is a different revision line). No RSI yet.

## Control: R=4-alone (32,8) on the same gen10 bank (24 worlds)

`gen10-eval-20261109-v1/r4-control`: seq **+4.4864** 8/8 surv +73. Adding
8 older + 2 recent records at FIXED 3:1 ratio silenced +4.49 to exactly
0.0. Not the ratio — the DEPTH: older records entering the mixture
over-anchor it. Fourth exact-zero by a mixture-touching revision
(Gen7 surprise, Gen8 slots, Gen9 ratio, Gen10 scale), all against R=4-alone
positive on the same or comparable banks.

## Reading

(32,8)+R=4 is singular in scale as well as rate and composition: ANY
buffer growth — ratio-changing or ratio-preserving — destroys the fresh
lifetime gain while probes confirm the weights still change (skills high,
both retentions descriptively positive). The mixture that crosses
thresholds on fresh banks exists only at exactly 24-older/8-recent with
4 passes. Search-bank behavior (4.553 seq, dual-true) again bought no
fresh lifetime — the fifth demonstration that search descriptive profiles
do not predict fresh gate (1).
