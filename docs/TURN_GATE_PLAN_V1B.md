# TURN-GATE plan V1b — cross-history transfer via checkpoint-carryover (FROZEN)

Status: FROZEN 2026-10-30. Single authorized Phase-A attempt under its own
plan. V1 stands preserved. No code, no bank, no worlds yet. Further
changes require V1c+.

## Why this design (read-only adjudication, zero new worlds)

- V1 (GO): candidate turns 0.81–0.83 on harmful vs ~0.05 on benign, per
  history, with cue sets DISJOINT across phases (A: patterns 0-3, B: 4-7,
  C: 8-11). So V1 already proved cross-context learning WITHIN a run.
- What's untested: SAME agent, NEW history (new codebook shuffle ⇒ new
  cue→valence mapping). Within-run phases change cue SETS; cross-history
  transfer additionally changes cue MEANINGS (frozen V1 rows: 6-7 flipped
  cues of ~9 decisive shared per pair; optimal disjoint cover totals 19).
- Structural expectation (pre-registered, not tuned): independent per-history
  shuffles ⇒ ~half of shared cues flip ⇒ memorization alone scores ~0;
  G2a ≥ 0.3 requires genuine re-adaptation. Realized flip counts will be
  reported from the run's own perCue labels (descriptive only).
- Pairing: sequential pairs (H1→H2, H3→H4, H5→H6; train odd, test even —
  arbitrary, pre-registered). No frozen-data pairing (fresh bank has no
  labels yet); the bar is absolute, not pair-relative.

## Mechanism (checkpoint-carryover; runner-level, no engine changes)

1. Train: full 1792-tick V1-identical run on H_train with join collector.
2. Transplant (in-memory, same process): construct fresh run on H_test,
   REPLACE its learners with the trained learners, then reset ONLY
   episodic/tick bookkeeping to fresh-init values (lastObservedTick,
   lastDecisionTick, credit.tick, pending=null, per-tick stats) and CLEAR
   replay buffers (recent/older=[]). CARRY: weights, config, EMAs
   (the learned model, not the data — buffers refill from H_test within
   ~40 ticks). G1 asserts the transplant diff is EXACTLY the tick/buffer
   fields (weights byte-identical pre/post) for all 24 agents; founder
   count and agentId alignment asserted (N=24 both sides).
3. Test: full 1792-tick H_test run with join collector (turn|harm −
   turn|ben on H_test cues).

## Grid and bank

- 3 pairs × (1 train + 1 transferred-test + 1 unlearned-test) = 9 mains,
  0 probes. Arms: transferred (carried weights) vs unlearned (zeroed,
  same V1 null). V1's frozen numbers serve as ceiling reference
  (descriptive, no new runs).
- Fresh dev bank `evidence/turn-gated-dev/fresh-02/`: 6 histories × 9 =
  54 seeds, range **407001–407054**. VERIFIED clean 2026-10-30 (zero
  exact tokens repo-wide; the 406xxx range scanned clean earlier but is
  NOT used — see note). Spend 9 mains (3 train + 3 test + 3 unlearned
  across 6 histories); remaining slots reserved-excluded.
- Caps: ≤300 exec (9 used), ≤20e9 ops, ≤3600s wall. Single attempt;
  crash-resume with dual provenance; no second run under V1b.

NOTE on range choice: 406001–406054 verified clean but is SKIPPED in
favor of 407001–407054 — reserved as the V1c arena if needed. Documented
to prevent future collision confusion.

## GO bars (conjunctive, fail-closed)

- G1 integrity: 9/9 mains complete; ledger exact (train+test+control
  ticks all ledgered; redone empty); transplant-integrity asserts pass
  (all 24 weights byte-identical pre/post, buffers empty, ticks zeroed,
  agentIds aligned); founder counts 24 everywhere.
- G0 training gate (checked FIRST, fail-closed like BALDWIN's G4):
  train-run gaps (turn|harm−turn|ben on H_train) ≥ 0.5 on all 3 pairs
  (V1 bar). Else INCOMPLETE-UNTRAINED (transfer test void — mechanism
  untested, not failed). Else continue.
- G2a transfer gap: mean transferred turn|harm−turn|ben across the 3 test
  histories ≥ 0.3 (lower than V1's 0.5: transfer is harder; pre-registered
  rationale, not tuned).
- G2b unlearned flat: |gap| ≤ 0.1 on all 3 test histories.
- G2c (descriptive): train-run gaps (≈0.8 expected, V1 replication);
  realized flip counts per pair; attenuation ratio transferred/V1.
- Verdict GO ⟺ G1∧G0-pass∧G2a∧G2b. NOGO if G2a fails with G0 intact.
  INCOMPLETE-UNTRAINED if G0 fails. INVALID on integrity/audit failure.
  No RSI claim; GO licenses proposing V1c (mechanism of transfer).
- G3 fixtures (gate before bank): 5 — transplant unit (synthetic learners:
  weights preserved, tick/buffer fields reset, id alignment, N mismatch
  refused); scorer branches (GO/NOGO/INVALID/INCOMPLETE); pairing-rule
  determinism on frozen V1 rows (reproduces the 19-flip cover);
  bank + union-exclusion (fresh-02); full triage clean.
  (No mid-run hook exists — transplant happens BETWEEN runs — so no hook
  fixture is applicable.)
