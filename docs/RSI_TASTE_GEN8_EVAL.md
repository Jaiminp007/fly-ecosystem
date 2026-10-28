# RSI Gen8 fresh eval — slots ρ=0.2 (gap key) — REJECT

> CORRECTION (2026-11-13): gate-(1) readings in the first version of this
> doc were a parsing artifact. True gate 1: seq +2.742 8/8 PASS; true
> gate 5: PASS (aR +0.301 7/8, bR +0.044 4/8). Fails gate 4 instead (see
> `docs/RSI_FRESH_EVAL_CORRECTION.md`). Verdict stands, gates change.

Claimant: `b13g-rho02` (S=2, ρ=0.2, gap key, R=4 base) via the
retention-first line (descriptively dual-true on v13, 4.121, trailing the
7.839 baseline). Bank `evidence/rsi-taste-v1/gen8-eval-20261106-v1/`
(bankSha `0d9f05fa…`), 8 histories × 6 arms = 48 worlds, one frozen
attempt, `--phase-slots 2 --slot-rate 0.2` on the R=4 Gen1 flags.
Source `taste-energy.mjs:f5399f58…`.

## Gates v2

1. vs unlearned: mean EXACTLY 0.0 element-wise (2.7419 both) 0/8 — FAIL.
2. vs frozen-after-A: +0.512 8/8, min positive — PASS.
3. vs reset: +1.80, all histories ≥ −1.00 — PASS.
4. skills: aSkill 0.571 6/8, bSkill 0.858 7/8, bAcq 0.205 4/8 — PASS.
5. retention: aRetention +0.301 7/8 surv +7 PASS; bRetention +0.044 4/8
   surv 0 PASS (thin — mean barely above zero).
6. transferReset: −0.00004 exactly, surv 0 — PASS (tie).
7. integrity asserts held — PASS.

Verdict: **REJECT** on gate (4) (bAcquisition 0.205, 4/8 < 6/8).
Gates 1 (+2.742), 2, 3, 5, 6 pass (corrected — no exact-zero). Successive
0/2 (Gen7 REJECT, Gen8 REJECT). No RSI. All prior failures stand.

## Control: R=4-alone on the same gen8 bank (24 worlds)

`gen8-eval-20261106-v1/r4-control` (Gen1 flags, S=1): seq **+4.4261** 8/8
surv +77. The bank offers large lifetime gains; the slot addition silenced
them to exactly 0.0. Mechanism silencing, not bank property.

## Reading

Three exact-zeros now (Gen7 surprise-gain, Gen8 slots, both vs R=4-alone
positive on comparable banks): additions that halve or dilute the
per-vector update rate keep every taste prediction below the greedy action
threshold, so behavior collapses to prior — all-or-nothing through the
threshold nonlinearity, not a graded loss. Mixture-tracking's fresh
lifetime gain is fragile to update-rate dilution. The search-bank
descriptive dual-true profile (4.121) bought no fresh lifetime.

Status line for the program: **0/2 successive accepts; cumulative 2408
worlds** (2096 + 312 this round: 240 search incl. 80 reported waste,
48 eval, 24 control).
