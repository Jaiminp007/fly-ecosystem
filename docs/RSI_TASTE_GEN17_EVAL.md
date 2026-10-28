# RSI Gen17 eval: rr125-fresh (ρ=1.25 × R=4) — ACCEPT (rate-split line 2/2 successive)

`evidence/rsi-taste-v1/gen17-eval-20261119-v1/` (bankSha `4bcc55df…`),
fresh 8-history bank, 6 arms, one frozen attempt. Config: Gen1 R=4
flags + `--replay-rate 1.25` (first-listed A-cell of the V25 four-way
tie). R=4-alone same-bank control: seq +3.989 8/8 surv +63 (11th base
proof). Claimant seq +4.013 — BEATS the base by +0.02, the first
revision in the program not to trail same-bank R=4-alone (attenuation
broken at the level leg; margin thin, direction right).

## V2 gates (CORRECTION-aware)

| gate | reading | verdict |
|---|---|---|
| g1 vs unlearned | seq +4.013, 8/8, surv +64 | PASS |
| g2 vs frozen | +0.997, 8/8, surv +23 | PASS |
| g3 vs reset | +3.593, 8/8 ≥−1.00, surv +49 | PASS |
| g4 skills | aSkill 1.527 8/8, bSkill 1.147 8/8, bAcq 0.933 8/8 | PASS |
| g5 retention | aR +0.140 7/8 (one −0.509) psv +4; bR +0.229 6/8 psv +1 | PASS — thin |
| g6 transfer | 0.0 tie | PASS |
| g7 integrity | runner asserts | PASS |

## Verdict: ACCEPT — rate-split line 2/2 SUCCESSIVE

Gen16 (ρ=1.5) + Gen17 (ρ=1.25): two successive fresh accepts in one
line — a program first. Six first-accepts... no: five first-accepts
(Gen6/10/12/13/16) + first second-successive (Gen17). The successive
condition for bounded RSI is MET in the rate-split line.

## What remains: A-directed productivity ONLY

V24 B-won, V25 tie → zero A-won generations. Claim needs TWO A-won
generations with accepts (V20 standard): V26 wide-menu A-won accept
(productivity 1/2, successive 3/3) AND V27 A-won accept (2/2) + total
budgets. The bar stands exactly where the Gen16/V25 docs put it.

Round worlds: 48 eval + 24 control = 72 (search counted in V25).
Cumulative 4144.
