# V22 addendum (2026-11-16): margin dead on the tr=1.0 substrate — redirect to tr=0.3

## Finding (mechanism probe, 1 history x 500 ticks, experiment path)

`marginBoosts` / live taste updates: tr=1.0/m=0.2 → 1/34; tr=0.3 →
m=0.1: 2/55, m=0.2: 3/41, m=0.3: 9/30. The dial is correctly plumbed
(config arrives, unit test pins bit-exact-off) but near-dormant at
tr=1.0: full-size steps blow across the .5 boundary in a single update,
so the pre-image is almost never inside a narrow margin. The V22 A-cells'
bit-identical scores are explained — not a bug, a substrate mismatch.

## Redirect (theory-driven, pre-bank, documented here)

Margin needs trajectories that LINGER at the boundary: the tr=0.3
substrate (Gen13 flags). V22b: everything x tr=0.3 + R=4 + k=1.
A (greedy, shifted up into the operating range): {m=0.2, m=0.3}.
B: the already-drawn {m=0.05, m=0.15} (mulberry32(20261116) draw stands,
now read at tr=0.3). Baseline cell: tr=0.3 bare (m=0) — the bar.
m=0.1 dropped (2 boosts/500 ticks is below the engagement floor).
New search bank v24. No eval without dual-true beating the tr=0.3
baseline. All other V22 rules (fresh-eval banks, v2 gates, copy control,
gen-1 window) carry over. The unrun V22 tr=1.0 B-cells are voided (0
worlds spent on them; the two A-cells' 32 worlds stand as the
dead-substrate evidence).
Prediction on record: m=0.3 should beat the tr=0.3 baseline on level
(boundary focus speeds the crossings tr=0.3 crawls through) with
retention at least intact; m=0.05 should ≈ baseline (near-off).
