# RSI v22/v22b search: margin dial (NEW CODE) — NO CLAIMANT, CLASS CLOSED

## v23 bank (`244ff21c…`): dead substrate

Gen1 R=4 tr=1.0: baseline 4.317 dual-true; a23-m01 (m=0.1) 4.316;
a23-m02 (m=0.2) 4.316 — bit-identical. Mechanism probe (experiment
path, 1 history x 200 ticks): marginBoosts = 0/0.1/0.2 → 0/1/1 against
13 live updates. Full-size steps cross .5 in one update; the pre-image
is never inside a narrow margin. 48 worlds (16+32). V22 B-cells voided.

## v24 bank (`a1533d21…`): tr=0.3 redirect (V22B)

Probes: m=0.1/0.2/0.3 → 2/3/9 boosts per 500 ticks. Round:

| cell | score | seq | vsR | A | B |
|---|---|---|---|---|---|
| gen1-tr03 (bar) | 4.864 | 4.095 | +0.769 | 1.715 vs 1.709 True | 1.502 vs 1.616 False |
| a24-m02 | 2.929 | 3.282 | −0.353 | True | False |
| a24-m03 | 4.541 | 3.687 | +0.855 | False | False |
| b24-m005 | 4.863 | 4.095 | +0.769 | True | False |
| b24-m015 | 3.224 | 3.752 | −0.528 | True | True |

No claimant (nothing dual-true above 4.864; the one dual-true, m=0.15,
trails by −1.6). m=0.05 ≈ baseline as predicted (near-off).

## Verdict: margin class CLOSED (first new-code dial, cleanly rejected)

Engages measurably but never helps: dormant at tr=1.0, degrading at
tr=0.3 (m=0.3: −0.3 level, both retentions False; m=0.15: −1.6).
Mechanism: near-boundary ×2 steps overshoot the crawl tr=0.3 sets up —
the ×2 gain converts lingering into oscillation across .5, thrashing
exactly the crossings it targets. Boundary-focus without
direction-awareness is anti-learning. 128 worlds this round (48+80).
Cumulative 3760.

## Next

V23: prioritized replay — tournament sampling by own |error| (new code).
The last untried leverage point is WHICH memories get replayed, not how
far each pull moves.
