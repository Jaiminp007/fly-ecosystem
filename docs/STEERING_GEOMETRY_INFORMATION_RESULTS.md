# Steering geometry information: failed fixed gate

The fixed own-founder one-step predictor test failed its joint C and transfer
gate. Geometry was better than base in 0/8 C histories and 4/8 transfer
histories; it was better than delayed geometry in 2/8 C histories and 6/8
transfer histories. Mean per-history MSE differences (geometry minus control)
were +2.682e-9 and +1.072e-9 in C, and -1.504e-8 and -2.463e-8 in transfer,
against base and delayed respectively. Negative means lower error. The fixed
requirement was a negative mean and at least 6/8 wins against both controls
in each evaluation family; a transfer-only comparison is not promotion.

The independent checker reconstructs 195,603 own training transitions and
83,492 frozen evaluation transitions, including 131 terminal transitions and
505 censored tape-boundary decisions. C evaluation has 49,435 native and
17,845 midpoint labels; transfer has 10,612 native and 5,600 midpoint labels.
Every predictor is per-founder, and evaluation weights remain frozen. The
histories were already reused and the diagnosis was outcome-informed; they are
held-out from feature fitting within this fixed test, not fresh qualification.

Captured protocol, source hashes, input hashes, transition/prediction records,
per-founder models and independent readback are in
`evidence/steering-geometry-information/20261026-v1`. The readback checks
input provenance, normalized updates, frozen predictions, scores and hashes;
it does not independently simulate physics or charge an embodied learner.
This result closes only the specified one-step feature hypothesis; it does not
establish that geometry lacks long-term value or that all other information is
insufficient. No acquired-skill, retention, transfer, pressure, fresh
qualification or autonomous-revision gate has been satisfied.
