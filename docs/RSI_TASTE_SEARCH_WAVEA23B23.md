# RSI v23 search: prioritized replay (NEW CODE) — NO CLAIMANT, CLASS CLOSED

## v25 bank (`6eaa7866…`): strongest baseline yet, tournament loses level

Gen1 R=4 T=1: baseline **8.582** dual-true (seq 6.312, vsR +2.27).

| cell | score | seq | vsR | A | B |
|---|---|---|---|---|---|
| gen1-search4 (bar) | 8.582 | 6.312 | +2.27 | 1.664 vs 1.453 True | 1.377 vs 1.369 True |
| a25-t2 / b25-t2 | 6.799 | 5.704 | +1.095 | 1.145 vs 0.769 True | 0.93 vs 0.841 True |
| a25-t3 / b25-t3 | 6.731 | 5.842 | +0.889 | 1.655 vs 1.784 False | 1.75 vs 1.136 True |

B-cells replicate A-cells bit-exactly (same procedure + bank + flags →
deterministic; V16 precedent — confirms reproducibility, not a bug).
B menu draw mulberry32(20261117) → ['3','2'].

## Verdict: priority class CLOSED

The dial is alive (real-trajectory probes: T=2/3 diverge strongly from
T=1 in weights, live counts, and ops — unlike the dormant margin), and
the T=3 A-erosion prediction CONFIRMED (narrow rehearsal starves the
A-leg). But both settings surrender ≈−1.8 level while holding
retention: rehearsal budget is zero-sum — focusing it on hard records
starves the easy ones that make up most of lifetime energy. A blend
dial would only interpolate back toward baseline, never beat it: the
class as a lead is dead, and stacking a losing dial is worse (Gen15
rule). No eval spent (no-claimant rule). 80 worlds. Cumulative 3840.

## Standing pattern (8 fresh evals, corrected)

Revisions keep lifetime superiority but trail same-bank R=4-alone and
die on retention/skill detail — EXCEPT V23, which is the first revision
to surrender LEVEL itself (−1.8) while holding both retentions. The
killer moved from retention-detail to level: the easy-records subsidy
is real.

## Next

V24: live/replay rate split (NEW CODE) — the step-size symmetry nobody
questioned: one rate for single samples AND rehearsal may be the actual
bottleneck both families circled (tr=0.3 helps = smaller steps help
live; R=4 helps = more rehearsal). Split them.
