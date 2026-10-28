# RSI Gen18 eval: s03-fresh (τ=0.3 × R=4) — ACCEPT (skip line 1/2, B-won)

`evidence/rsi-taste-v1/gen18-eval-20261122-v1/` (bankSha `c1a8440a…`),
fresh 8-history bank, 6 arms, one frozen attempt. Config: Gen1 R=4
flags + `--replay-skip 0.3` (B-procedure's robust cell from the V28
four-claimant round). R=4-alone same-bank control: seq +5.6895 8/8
surv +82 (12th base proof). Claimant seq +5.761 — beats the base by
+0.07 (second attenuation break: Gen17 +0.02, Gen18 +0.07; revisions
now hold level AND retention structure).

## V2 gates (CORRECTION-aware)

| gate | reading | verdict |
|---|---|---|
| g1 vs unlearned | seq +5.761, 8/8, surv +81 | PASS |
| g2 vs frozen | +1.234, 8/8, surv +29 | PASS |
| g3 vs reset | +4.635, 8/8 ≥−1.00, surv +64 | PASS |
| g4 skills | aSkill 7/8 (one −0.87, ≥5/8 ✓) bSkill 8/8 bAcq 8/8 | PASS |
| g5 retention | aR +0.377 7/8 psv +1; bR +0.193 6/8 psv +2 | PASS |
| g6 transfer | 0.0 tie | PASS |
| g7 integrity | runner asserts | PASS |

## Verdict: ACCEPT — skip line 1/2, productivity 0/1

Sixth first-accept (Gen6/10/12/13/16/18 across five lines; rate-split
holds the only 2/2). The round was B-won → this accept carries NO
A-direction. Claim still needs TWO A-won generations with accepts in
ONE line + budgets. V29 (skip refinement, A-directed around τ=0.3)
must be A-won + accept (line 2/2, productivity 1/2); V30 A-won +
accept (2/2) to claim. Stated before V29 runs.

Round worlds: 48 eval + 24 control = 72 (search counted in V28 wave
doc). Cumulative 4456.
