# TURN-GATE Results V1d — plastic-vs-rigid probe (single authorized attempt)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1D.md` (no amendments).
Bank: `evidence/turn-gated-dev/fresh-04/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-04/`.

## Verdict: PHASE-D-GO; seg2 PARTIAL CONVERGENCE (neither hypothesis fully supported)

Conjunctive gates (pre-registered, seg1 = V1c replication arm):

- **G1 integrity 12/12 PASS** — join 1.00 on all 12 mains (incl. both
  transplants per pair); digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8273 / 0.8325 / 0.8260, all ≥ 0.5
  (FOURTH replication of the 0.81–0.83 learning effect: V1, V1b, V1c, V1d).
- **G2a seg1 mean gap 0.5482 ≥ 0.3 PASS** — per-pair 0.6468 / 0.4277 / 0.5700.
- **G2b unlearned flat PASS** — +0.0015 / +0.0002 / +0.0006.
- **Seg1 mechanism replication (descriptive):** same-val 0.9465 / 0.9513 /
  0.9519, flipped 0.5431 / 0.5949 / 0.6246 → confirms all three (THIRD
  replication of the tax structure: V1b, V1c, V1d-seg1).

Ledger (exact): **12 mains, 0 probes, 21504 worldTicks, 516096 founderSlots,
1.92e9 scalarOperations** — within all caps; `redone: []`.

Descriptive seg2 flip-split (Amendment-A1 metric; pre-registered bands):

| pair | seg1 flipped | seg2 flipped | Δ | class |
|---|---|---|---|---|
| 409001→409010 | 0.5431 | 0.7304 | +0.1873 | INTERMEDIATE |
| 409019→409028 | 0.5949 | 0.6746 | +0.0797 | RIGID |
| 409037→409046 | 0.6246 | 0.7407 | +0.1161 | INTERMEDIATE |

Same-valence unchanged (0.950→0.951); replayed-vs-train not re-reported
(seg1 already establishes partial adaptation; seg2 question is convergence).

## Reading: partial convergence (descriptive; claims stop here)

Doubled exposure (cumulative 3584 ticks on the test codebook) moves every
pair upward (+0.08 to +0.19, mean flipped 0.587→0.709) without reaching
convergence (max 0.741 < 0.85) and without locking in (2/3 pairs exit the
rigid band upward; nothing decreases, nothing falls below 0.4). The tax
shrinks by roughly one-third of the remaining distance-to-train per
doubling — a speed problem with a long tail, not a structural wall and
not a quick fix. H-plastic (converge at 2×): NOT supported. H-rigid
(asymptote inside the band): WEAKLY supported at best (1/3 pairs).
Licensed next step (per plan): V1e 4×/asymptote probe, which may GATE on
convergence — the only line licensed to do so.

## Provenance (two corrective patches, both documented)

1. **Pre-run crash + 1-line fix.** The first invocation executed train +
   seg1 of pair 0, then crashed: seg1 rows never persisted weights (the
   transplant source seg2 requires). Root cause: the weights-save line
   covered only `tag==='train'` in `runOne`, while seg1 runs in an inline
   block. Fix (1 line, committed separately): save `row.weights` post-
   advance in the seg1 block. The partial attempt-04 dir (2 rows, no
   verdict, no dev-results) was removed as invalid intermediate state —
   the failure is recorded here, nothing verdict-bearing was lost — and
   the run restarted clean. Final evidence is 100% post-fix, single
   provenance, `redone: []`. Fixtures re-verified 8/8 after the fix
   (the seg2-source invariant is now covered by construction: seg1 rows
   carry weights by the same line that seg2 asserts them).
2. **Post-run classifier gap + analytic relabel (zero new worlds).** The
   filed run's `classifySeg2` else-clause labeled the plan-undefined zone
   (0.7, 0.85) as DEGRADED (reserved by the plan for <0.4). Pairs 1,3
   (0.730, 0.741) were mislabeled. Fix: explicit INTERMEDIATE branch;
   regression test added (pure-unit, existing tests untouched). The frozen
   rows were rescored analytically with the fixed code: all numerics
   byte-identical, ONLY the two class strings changed (verified by field
   diff). `dev-results.json` patched on those two strings alone (V1c
   string-fix precedent); rows, ledger, gates, verdict untouched.
