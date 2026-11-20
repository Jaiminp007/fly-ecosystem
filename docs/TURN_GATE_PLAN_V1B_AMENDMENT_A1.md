# TURN-GATE plan V1b — Amendment A1 (pre-execution, design unchanged)

Status: FROZEN as part of V1b line on 2026-10-30. This amends ONLY the G3
fixture bullet below. Grid, arms, bars G1/G2, verdict, bank, caps, single
attempt: UNCHANGED from `docs/TURN_GATE_PLAN_V1B.md`. Rationale recorded;
no experimental content altered, hence no new version.

## What was wrong

G3 listed "pairing-rule determinism on frozen V1 rows (reproduces the
19-flip cover)" as a fixture. But the frozen pairing is SEQUENTIAL by bank
order (pairs [(h0,h1),(h2,h3),(h4,h5)]), decided precisely BECAUSE fresh-bank
labels don't exist pre-run. A determinism fixture for an optimal-matching
rule would test dead code (the runner never calls it), while the actual
load-bearing unit — the transplant integrity checker — would go untested.
Caught pre-code (not post-hoc): the 19-flip cover analysis remains valid
adjudication for WHY sequential pairing is safe (any pairing faces
~50%-flipped shared cues), but it is not code.

## Replacement (binding)

G3 fixtures, corrected list (5 + triage = G3 gate):
1. transplant unit — synthetic learners: weights preserved exactly,
   tick/buffer fields reset to fresh-init values, agentId alignment
   enforced, founder-count mismatch refused;
2. transplant-integrity-checker unit — synthetic trained+transplanted pair:
   diff is EXACTLY the tick/buffer/statistics field set (carried set
   deep-equal); planted corruptions (skipped agent, altered weight,
   non-zeroed tick) all detected;
3. scorer branches — GO / NOGO / INVALID / INCOMPLETE-UNTRAINED on
   synthetic row sets;
4. bank + union-exclusion (fresh-02) — build + uniqueness + spent-list
   verification;
5. full `npm test` triage clean (only the 6 known shifted-pristine
   failures).

All other frozen terms stand verbatim.
