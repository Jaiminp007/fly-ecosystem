# RSI Gen9 fresh eval — (48,8) x R=4 — REJECT

> CORRECTION (2026-11-13): gate-(1) readings in the first version of this
> doc were a parsing artifact. True gate 1: seq +5.358 8/8 PASS (see
> `docs/RSI_FRESH_EVAL_CORRECTION.md`). Verdict stands on gate 5 alone.

Claimant: `b14-mem48-8` (score-best + dual-true on v14, +1.59 over the
same-bank R=4 baseline). Bank `evidence/rsi-taste-v1/gen9-eval-20261107-v1/`
(bankSha `853bdfb5…`), 8 histories x 6 arms = 48 worlds, one frozen
attempt, Gen1 R=4 flags + `--capacity 48 --recent 8`.
Source `taste-energy.mjs` (V12 build; S=1 path bit-identical).

## Gates v2

1. vs unlearned: mean EXACTLY 0.0 (5.358 both, 8/8 identical) — FAIL.
2. vs frozen-after-A: +1.094 (5.358 vs 4.264) — PASS.
3. vs reset: +3.78, reset 7/8 positive — PASS.
4. skills: aSkill 1.68 8/8, bSkill 1.49 8/8, bAcq 1.54 8/8 — PASS (strong).
5. retention: aRetention +0.297 4/8 PASS / bRetention −0.27 3/8 — FAIL.
6. transferReset: 0.0 exactly, surv 0 — PASS (tie).
7. integrity asserts held — PASS.

Verdict: **REJECT** on gate (5) (bRetention −0.27, 3/8). Gate 1 was
+5.358 8/8 PASS (corrected — no exact-zero). Successive 0/2 (Gen7/Gen8/
Gen9 rejects on retention/skill detail, never lifetime). No RSI.

## Control: R=4-alone (32,8) on the same gen9 bank (24 worlds)

`gen9-eval-20261107-v1/r4-control`: seq **+5.1943** 8/8 surv +81. The bank
offers large lifetime gains; widening the buffer to (48,8) silenced them
to exactly 0.0. Mechanism silencing, not bank property — fourth exact-zero
(Gen7 surprise, Gen8 slots, Gen9 wide memory), all against R=4-alone
positive on comparable banks.

## Reading

Silencing now demonstrated in BOTH composition directions: diluting the
per-vector update rate (slots' random halves, surprise live-overwrite)
keeps predictions below the greedy threshold; concentrating the mixture
old ((48,8): 40 older + 8 recent vs 24+8) over-anchors A — behavior locks
to prior-identical actions (0.0 lifetime) while probes confirm the weights
DID change (skills high, A-ret +0.30) and B starves (B-ret −0.27, B-records
diluted 8/48). (32,8)+R=4 is a narrow optimum in mixture rate x
composition; every revision that touches the replay mixture breaks the one
passing configuration. The base is robust (R=4-alone positive on 3/3 fresh
banks: +5.41, +4.43, +5.19); no revision has passed fresh eval except Gen6.
