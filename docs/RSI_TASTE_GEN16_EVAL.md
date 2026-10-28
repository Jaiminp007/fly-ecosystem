# RSI Gen16 eval: rr15-fresh (ρ=1.5 × R=4) — ACCEPT (rate-split line 1/2)

`evidence/rsi-taste-v1/gen16-eval-20261118-v1/` (bankSha `0f08fd60…`),
fresh 8-history bank, 6 arms, one frozen attempt. Config: Gen1 R=4
flags + `--replay-rate 1.5`. R=4-alone same-bank control: seq +5.1275
8/8 surv +76 (10th base-positive proof; claimant trails by −0.16 —
attenuation, not silencing).

## V2 gates (CORRECTION-aware: `sequence` IS gate-1)

| gate | reading | verdict |
|---|---|---|
| g1 vs unlearned | seq +4.967, 8/8, surv +75 | PASS |
| g2 vs frozen | +1.415, 8/8, surv +26 | PASS |
| g3 vs reset | +4.146, 8/8 ≥−1.00, surv +56 | PASS |
| g4 skills | aSkill 1.114 8/8, bSkill 1.629 8/8, bAcq 1.280 8/8 | PASS |
| g5 retention | aR +0.642 7/8 psv +2; bR +0.216 5/8 psv +2 | PASS |
| g6 transfer | 0.0 tie | PASS |
| g7 integrity | residual <1e-7, no revival, common starts (runner asserts) | PASS |

## Verdict: ACCEPT — fifth first-accept, new line

Gen6 (main), Gen10 (fixed-ratio), Gen12 (motor), Gen13 (retention),
Gen16 (rate-split): five first-accepts in four lines, zero second
successives anywhere. Rate-split line stands at 1/2. The ρ=1.5 margin
was boundary-predicted (small, both legs positive — the profile that
held in Gen12/Gen13) and held on fresh seeds.

## Productivity ledger (honest)

V24 was B-won (claimant from the random procedure; A cells both
single-leg failures). A-directed productivity for this line is therefore
NEGATIVE at 1/2. The line clinches only on: V25 A-won accept (2/2
successive, productivity 1/2) AND V26 A-won accept (productivity 2/2)
+ total-budget accounting. Two more generations, both must be A-won.
No shortcut, no retroactive credit.

Round worlds: 80 search + 48 eval + 24 control = 152. Cumulative 3992.
