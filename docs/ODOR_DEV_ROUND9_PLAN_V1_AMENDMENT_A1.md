# ODOR DEV ROUND 9 — PLAN V1 AMENDMENT A1 (FROZEN)

Date: 2026-11-02. Status: FROZEN. One-constant correction to F3; zero
mechanism change; zero worlds. Parent: `docs/ODOR_DEV_ROUND9_PLAN_V1.md`.

## The error (found pre-fixture, by counting)

F3 froze the K-scaling formula as per-cycle delta(K=8) − delta(K=1)
== 7*(30 + 2*82) = **1358**. Recounting the ACTUAL frozen billing:

- Legacy (K=1, verbatim path): per cycle = choose-prediction 29 +
  2 × update-call (prediction 29 + lumped 52) = 29 + 2×81 = 191.
  (The legacy update() calls prediction() — a 29 each — which the
  F3 formula's author dropped, counting the lumped 52 alone.)
- K=8 path: per cycle = choose-prediction 8×30=240 + 2 × 656
  (inline heads, no prediction() calls) = 240 + 1312 = 1552.
- True difference: 1552 − 191 = **1361** (the frozen 1358 is short by
  exactly the 3 dropped prediction() calls' 29-vs-30 unit: 3×1).

The formula assumed legacy prediction bills 30; it bills 29. Nothing
else in the plan is affected (instrument, billing constants K*82 /
K*30, null-verbatim path, scorer, verdict all stand as frozen).

## Correction (frozen)

F3's K-scaling assertion reads **1361**, composition
(240−29) + 2×(656−81) = 211 + 1150, on identical record streams.
All other F3 text unchanged (same-K determinism; totals reconcile).
Fixtures implement 1361; 1358 must not appear in code.
