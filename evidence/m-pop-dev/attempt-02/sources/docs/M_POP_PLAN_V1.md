# M-POP plan V1 (lineage-retention substrate + measurement)

Frozen 2026-10-29. Status: DESIGN ONLY until implementation + execution.
Single authorized Phase-A attempt (2 arms × 6 histories = 12 mains, zero
probes). This is the Vision's milestone-5 vehicle and the M2-lineage reading.
Parent findings (do not re-litigate): single-learner retention dead on all
fronts; trained≡zeroed per-tick; exploration-tax is death-driven. New
substrate, new question: does SELECTION across generations retain what
lifetime learning cannot?

## Instrument delta (harness only, default-off; verified necessary read-only)

TasteExperiment crashes on newborns (`learners[fly.id]` undefined for new
ids). Fix, minimal and null-default:

1. Constructor gains `reproduction:false` (default OFF → every existing study
   bit-identical, including Gen1). Passed to `new World({... reproduction,
   mutation:false ...})`. Mutation stays OFF (standing variation only —
   frozen design decision; mutational fuel is a future line, not this one).
2. New exported helper `syncNewbornLearners(run)`: for each alive fly lacking
   a learner, `createTasteEnergyBody(id, fly.brainSeed, {same options as the
   run})`; if arm is `frozen`, freeze immediately. Called at top of `step()`
   BEFORE the S2-gate block (so sched arms, if ever combined, behave).
   Plain-JS bookkeeping; billing identical to a same-tick main start
   (creation bills nothing new — same as construction).
3. Lineage is read, never written, by us: `world.lineage` (parents,
   generation, born/died) + `world.flies` (living descendants) +
   `totals` (births/deaths/causes). No checkpointing in Phase A (no anchors
   saved, no probes) → no restore-path changes.
4. Arms: `candidate` (learns every generation — lifetime learning + selection)
   vs `frozen` (never learns — selection alone). This IS the trained-vs-zeroed
   discrimination, lifted to lineages (M-DISCRIMINATE's gate, inherited).

## Bank + execution (fresh, union-excluded)

- Phase-A dev bank `evidence/m-pop-dev/fresh-01/`: deterministic 388001–
  388054 (6 histories × 9), `fixture-seeds-01.json` post-build (V1c ordering
  lesson). Union-excludes all prior banks, fixture ranges, test tokens
  (386xxx CUE range respected — untouched). 386xxx is NOT spent (no bank
  file exists anywhere for it); 384xxx–385xxx/387xxx are spent, excluded.
- Stage 0 (feasibility, INSIDE the single attempt): history-1 pair
  (candidate + frozen) runs first; assert total births ≥ 1 across both;
  else throw INVALID-FEASIBLE (fail-closed, publish partials, line closes
  — no second attempt). Rationale (read-only): birth needs energy ≥65 +
  mature nearby mate + act flag; children spawn at 48; whether any of this
  happens in 1792 ticks is empirical, not deducible.
- Stage 1 (only if Stage 0 passes): remaining 5 histories × 2 arms.
  Totals: 12 mains, 0 probes. Expected ≈215k ticks / ≈2M slots / ≈2e9 ops
  (well under caps: ≤300 exec / ≤20e9 / ≤3600s / ≤200MB).

## Conjunctive bars (all must pass → GO; any fail → line CLOSED, no Phase Q)

- G1 feasibility: ≥1 birth in Stage 0 (else INVALID-FEASIBLE, close).
- G2 lineage persistence (the question): fraction of founder lines with ≥1
  living descendant at end, candidate MINUS frozen ≥ +0.15.
- G3 lineage depth OR breadth: mean living descendants/line candidate −
  frozen ≥ +1.0, OR max generation candidate > frozen. (One of the two;
  pre-registered OR.)
- G4 caps held (ledger). G5: fixtures green BEFORE any world: (a) newborn
  sync unit (fake run + fake newborn → learner created, frozen arm frozen);
  (b) per-representation smoke N/A (no new reps); (c) scoring unit tests
  (synthetic lineage arrays → exact verdict incl. ties/empties);
  (d) bank build via module import; (e) full suite = 6 shifted-pristine
  failures only.
- Verdict: GO iff G1 ∧ G2 ∧ G3 ∧ G4 ∧ G5 (G5 pre-execution). GO licenses
  Phase B (social/cooperation extension) under a frozen V1a — NEVER an
  in-place expansion of this attempt.

## Not included (unchanged)

No mutation (standing variation only); no weight inheritance (newborns
start zeroed — inheritance is a future line, and this design choice is what
makes the test about SELECTION rather than Lamarckism); no qual/reserve
contact; no bank reuse/regeneration; no rescoring; no RSI claims (lineage
selection ≠ agent self-modification — the Vision distinction stands);
no second attempt (crash-resume only under V1d terms).
