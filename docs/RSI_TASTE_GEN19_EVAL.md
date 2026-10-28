# RSI Gen19 eval: evict × skip (b=1, τ=0.15) — REJECT gate-5

## Bank `2e2e8f73…`, 8 histories × 6 arms, CORRECTION-aware reading

Claimant seq +5.056 8/8 surv+84; same-bank R=4-alone +4.9033 8/8
surv+83 (13th base proof). Claimant beats base on LEVEL by +0.15 —
third attenuation break (Gen17 +0.02, Gen18 +0.07, Gen19 +0.15). The
lead keeps winning level and dying on retention detail.

* g1 (sequence): +5.056 8/8 surv+84 PASS.
* g2 (vs frozen +3.239): +1.817, per-history all >0, 8/8, surv +42 PASS.
* g3 (vs reset +1.183): +3.873, all ≥−1.00, 8/8, surv +73 PASS.
* g4 (skills): aSkill 1.915 8/8, bSkill 1.402 8/8, bAcq 1.142 6/8 PASS.
* g5 (retention): aR −0.220 (3/8, psv −4) FAIL; bR −0.025 (4/8, psv +4)
  FAIL. Both legs slightly negative — strict means>0 bar holds.
* g6 (transfer): 0.0 tie PASS. g7 asserts PASS.

## Verdict: REJECT gate-5 (retention, both legs)

V33 was A-won search (+1.02/+0.95 dual-true) but fresh retention says
no: search bank was favorable noise, exactly what the fresh bar is
for. Evict line: 0/2 successive, search-productivity 1/1 (V33 A-won)
but no accept. V34 = keep-hard-alone × R-companion (the +2.16 lead
without skip, asking whether τ diluted it) decides: A-won + accept →
evict 1/2; else evict CLOSED → negative synthesis (all predeclared
classes exhausted). Round 80 search + 48 + 24 eval/control = 152
worlds. Cumulative 4896.
