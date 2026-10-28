# Indexed overlap prototype: no cost win

The fixed 32-unit bucket prototype preserves the original recommendation and
strict tie order on 5,000 seeded geometries, boundary and duplicate fixtures,
an out-of-order tie and an unsafe-cell fallback. It is not integrated into an
embodied controller.

On the same 83,617 recorded C/transfer decisions, it exactly reproduced every
recommendation and all 16 captured-source final checkpoints. Under its declared
abstract work schedule and retained-scratch byte-time, it **costs more**:

| Segment | Additional operations | Additional scratch byte-ticks | Added energy / original founder |
| --- | ---: | ---: | ---: |
| C | 8,652,278 | 27,445,661 | +0.0143 |
| Transfer | 2,675,275 | 6,553,699 | +0.00435 |

Only 17,584/67,348 C decisions and 3,909/16,269 transfer decisions are cheaper
under this proposed accounting. Neighbor buckets are traversed in both
directions and retain index state, offsetting the gross pair-pruning ceiling.
These are same-state offline estimates, not physical-run outcomes, and the
abstract schedule is not a complete low-level cost proof. No net saving or
qualification is claimed; do not integrate this version as an optimization.

An independent post-outcome combinatorial checker reconstructs declared work
and encoded scratch bytes for all 83,617 decisions and reproduces the captured
final checkpoints. Captured protocol, sources, per-history rows, results and
readback are in `evidence/indexed-overlap-measurement/20261026-v1`. The next
approach needs a concrete way to avoid duplicated neighbor traversal and paid
index storage, plus a separately fixed exact-equivalence and cost comparison.
The failed acquired-learning, retention and transfer gates remain unchanged.
