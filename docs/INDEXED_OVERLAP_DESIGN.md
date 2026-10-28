# Exact indexed overlap recommendation

The fixed prototype groups each observed point by `floor(forward/32)`, then
visits only the same and adjacent cells for each first index. Every eligible
pair has forward separation at most 32, so no eligible pair is omitted. The
bucket visitation order can differ from the original nested loops: on an exact
score tie between two qualifying pairs, the lexicographically earlier pair
wins, matching the original first-then-second order. A tie with the original
center winner never replaces that center. The final scratch separation is also
restored to the original final-pair value. Unsafe cell integers fall back to
the original loop rather than relying on imprecise integer neighbors.

The index lives in the body's scratch object and remains retained until the
next decision; its actual encoded bytes must be billed for the complete tick.
The prototype explicitly meters cell classification and insertion, neighbor
lookup, index/order tests, separation, distance, midpoint scoring and tie
resolution. Its operation schedule is an abstract conservative proposal, not
an independently verified machine-instruction or energy measurement.

First compare outputs on deterministic boundary, duplicate and tied-score
geometries plus randomized cases. Then replay the exact earlier C/transfer
segments as a passive observer and compare recommendation outputs and
per-decision proposed work plus added encoded-state byte-time. This is an
offline same-state accounting estimate; it cannot include policy feedback or
prove a net physical outcome. Before embodied use, test full-state billing,
terminal debt, checkpoint continuation and matching controls. Any controller
must still pass the unchanged survival, retention, transfer and fresh gates.
