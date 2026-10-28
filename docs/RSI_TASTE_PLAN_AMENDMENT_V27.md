# RSI plan amendment v27: cautious-live × aggressive-replay (combination, no new code)

## Why (the joint optimum V24 predicted but never tested)

V24's motivation: "cautious live + aggressive replay, or aggressive
live + consolidating replay — no single rate can express either."
V24–V26 mapped replay-rate at tr=1.0 (optimum ρ≈1.25–1.5, successive
2/2). Gen13 proved tr=0.3 (slow live) wins retention at R=4. The JOINT
setting (tr=0.3, ρ=1.5) — slow single-sample steps + fast rehearsal
strides — is the obvious joint optimum and was never tested (V20
combined μ×tr and failed; this is a different pair: BOTH accepted
dial-families, live-rate × replay-rate = the full rate matrix).

## Menu (Gen1 R=4 base (32,8) S=1 orthogonal greedy, R=4; tr/ρ vary)

* Baseline: Gen1 R=4 (tr=1.0, ρ=1.0) — the bar never moves.
* A (greedy, joint-optimum hypothesis): {(tr=0.3, ρ=1.5),
  (tr=0.3, ρ=2.0)} — cautious live, aggressive replay; ρ=2.0 as the
  stronger-rehearsal companion.
* B (random, matched, bracketing pool): two of {(tr=0.3, ρ=1.0),
  (tr=0.5, ρ=1.5), (tr=0.5, ρ=2.0)} via mulberry32(20261121).

## Rules unchanged

New search bank v29, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. `--taste-rate` + `--replay-rate` flags.
No eval without dual-true beating baseline. Claimant → fresh 8-history
bank (6 arms, v2 gates + world-cap, copy control).

## Stakes (new combination line — V20 window stays closed)

* This is a NEW line (ρ×tr; V20 μ×tr failed and stays failed — lines
  never cross-credit). Successive counter for this line starts 0/2;
  productivity 0/2.
* V27 A-won + fresh accept → combination-2 line 1/2 → V28 (A-directed
  around V27 winner) decides.
* V27 B-won/tie/no-claimant/REJECT → combination-2 closed; program
  moves to next new-code class (adaptive per-record rates: surprise ×
  rate-split — fast rehearsal for surprising records, slow for boring
  ones — the last untested interaction of accepted mechanisms).
* Bounded RSI iff this line (or any line) reaches 2/2 successive with
  2/2 A-directed productivity + budgets. The rate-split 2/2 stands as
  the successive benchmark to beat.
