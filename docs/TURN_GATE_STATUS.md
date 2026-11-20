# TURN-GATE status (cue-conditioned turning, now transfer)

V1 GO (replication, 0.81-0.83, unlearned flat). Adjudicated: V1 phases use
DISJOINT cue sets (A:0-3, B:4-7, C:8-11) with per-history shuffled valences —
so V1 already proved cross-context learning; untested is SAME-agent transfer
to a NEW history (new codebook shuffle; frozen V1 rows: 6-7 flipped cues of
~9 decisive shared per pair; optimal disjoint cover totals 19).

- 2026-10-26: `docs/TURN_GATE_PLAN_V1.md` FROZEN (DESIGN ONLY). Verified
  read-only: 10 arena contexts; S-GATE symmetric billing precedent;
  transfer 0.0 zero-control. Instrument: same join collector as CUE
  (cue+action+intake per tick, no new engine code).
- 2026-10-29: Phase-A EXECUTED → **GO**. G1 join 1.00 everywhere; G2a
  turn|harm−turn|ben 0.81–0.83 on 6/6 histories (bar ≥0.5); G2b unlearned
  flat ≈0.00. 12 mains, all caps, no crash, no resume.
- 2026-10-30: Phase-B FROZEN as `docs/TURN_GATE_PLAN_V1B.md` (cross-history
  transfer via in-memory checkpoint-carryover: 3 pairs × (train + transferred
  test + unlearned test) = 9 mains on fresh bank 407001–407054 verified
  clean — 406xxx held in reserve for V1c; G1 transplant-integrity +
  G0 training gate + G2a ≥0.3 transfer gap + G2b unlearned flat) +
  `docs/TURN_GATE_PLAN_V1B_AMENDMENT_A1.md` (pre-execution: pairing-rule
  fixture replaced by transplant-integrity-checker unit; experiment
  unchanged). Instrument + fixtures green, triage clean, bank built.
- 2026-10-31: Phase-B EXECUTED → **GO**. G1 join 1.00 everywhere; G0 train
  0.8128/0.8239/0.8170; G2a transferred mean 0.5779 (0.5178/0.5469/0.6689);
  G2b unlearned ≈0.00. 9 mains, all caps, no crash on rows; 1-token
  post-run bookkeeping NameError fixed separately + resume scored with
  zero rows recomputed (dual provenance). See
  `docs/TURN_GATE_RESULTS_V1B.md`. V1c probe under its own frozen plan —
  implemented (see Phase-C IMPLEMENTED below), not yet executed.
- 2026-10-31: Phase-C FROZEN as `docs/TURN_GATE_PLAN_V1C.md` (DESIGN ONLY).
  Read-only post-hoc of frozen V1b rows: transfer tax = uncorrected-flip
  residue (same-val 0.94–0.95, flipped 0.51–0.62, train-self 0.91).
  V1c replicates V1b design on fresh bank 408001–408054 (moved from 406xxx
  by Amendment A2; re-verified clean at build) with identical gates +
  pre-registered DESCRIPTIVE flip-split (same-val ≥0.85 AND flipped in
  [0.4,0.7] confirms mechanism; full relearning or pure replay falsifies
  it).
- 2026-10-31: Phase-C IMPLEMENTED (`scripts/turn-gated-dev-v1c.mjs` +
  `tests/turn-gated-dev-v1c.test.mjs` 8/8 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-03/` built 408001–408054
  post-fixtures). Amendments pre-code: A1 flip-split metric = contact-
  weighted correctness (band unchanged; gap-scale would misfire) + A2 bank
  range + reserve-masking rule (never print literal future ranges) +
  bank-test lifecycle conversions (V1b test → post-spend refusal per RSI
  precedent; V1c test → post-build refusal + read-only bank checks).
- 2026-10-31: Phase-C EXECUTED → **GO, mechanism CONFIRMED**. G1 join
  1.00 everywhere; G0 train 0.813/0.830/0.809; G2a transferred mean 0.609
  (0.519/0.739/0.567); G2b unlearned ≈0.00. Flip-split replicates V1b
  structure on the fresh bank (same-val 0.941–0.952, flipped 0.527–0.682;
  both falsifiers avoided; lens-consistency within pairs). 9 mains, all
  caps, single clean run (`redone: []`). Mechanism PROMOTED to replicated
  finding (V1b+V1c, n=6 pairs, two banks) — not an intervention, not RSI.
  Next: extended-run / IB-capacity / GS-hyperparameter probes under their
  own frozen plans — not started.
- 2026-10-31: Phase-D FROZEN as `docs/TURN_GATE_PLAN_V1D.md` (DESIGN ONLY).
  Plastic-vs-rigid adjudication: 12 mains (train + transferred-seg1 gated
  V1c-replication + transferred-seg2 descriptive exposure-doubling via
  second transplant of seg1-end weights + unlearned) on fresh bank
  409001–409054 (verified clean pre-freeze, 0 hits; re-verify at build).
  Continuation impossible (runs terminate at phase end) so seg2 = fresh
  run + transplant. Interpretive bands pre-registered (≥0.85 converged /
  [0.4,0.7] rigid / <0.4 degraded), non-gating by necessity (first 2×
  measurement). Next: implement, then single attempt.
- 2026-10-31: Phase-E IMPLEMENTED (`scripts/turn-gated-dev-v1e.mjs` +
  `tests/turn-gated-dev-v1e.test.mjs` 9/9 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-05/` built 410001–410054
  post-fixtures). Seg1/seg2/seg3 rows persist weights (chained transplant
  sources); scorer requires seg2/seg3/seg4 triples fail-closed;
  segSummary/classifySeg generalized (link-to-link deltas) + tested
  (chain + boundaries incl. INTERMEDIATE regression carried over). Bank
  test → post-build refusal + read-only bank checks. Next: single
  authorized attempt.
- 2026-10-31: Phase-D IMPLEMENTED (`scripts/turn-gated-dev-v1d.mjs` +
  `tests/turn-gated-dev-v1d.test.mjs` 8/8 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-04/` built 409001–409054
  post-fixtures). Seg1 rows persist weights (second-transplant source);
  scorer requires seg2 triple fail-closed; seg2Summary/classifySeg2 pure +
  tested (CONVERGED/RIGID/DEGRADED/INDETERMINATE + delta). Bank test →
  post-build refusal + read-only bank checks.
- 2026-10-31: Phase-D EXECUTED → **GO, PARTIAL CONVERGENCE**. G1 join
  1.00 x12; G0 train 0.827/0.833/0.826 (4th replication); G2a seg1 mean
  0.548; G2b unlearned flat. Seg1 mechanism replicates (3rd time). Seg2:
  flipped +0.08/+0.12/+0.19 everywhere (mean 0.587→0.709), classes
  INTERMEDIATE/RIGID/INTERMEDIATE — tax shrinks ~1/3 per doubling,
  neither hypothesis fully supported. 12 mains, all caps, `redone: []`.
  Two documented patches: (1) pre-run 1-line seg1-weights fix after
  pair-0 crash, partial dir removed, restarted clean (single
  provenance); (2) post-run classifier INTERMEDIATE branch + analytic
  string-only relabel (numerics verified identical). Tax = slow-to-
  correct residue. Next: V1e 4x/asymptote probe (may gate on
  convergence) under its own frozen plan — not started, no RSI claim.
- 2026-10-31: Phase-E FROZEN as `docs/TURN_GATE_PLAN_V1E.md` (DESIGN ONLY).
  Vanish-vs-floor adjudication: 18 mains (train + seg1 gated + seg2/seg3/
  seg4 descriptive via 3rd/4th transplants + unlearned) on fresh bank
  410001–410054 (verified clean pre-freeze, 0 hits; re-verify at build).
  Seg1-gated verdict (comparability); convergence gate DECLINED with
  pre-registered reasoning (extrapolation predicts seg4 ~0.84 borderline;
  trajectory more informative than threshold; descriptive CONVERGED
  answers the question either way). Trajectory prediction recorded:
  ~1/3 closure per doubling.
- 2026-10-31: Phase-E IMPLEMENTED (`scripts/turn-gated-dev-v1e.mjs` +
  `tests/turn-gated-dev-v1e.test.mjs` 9/9 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-05/` built 410001–410054
  post-fixtures). Seg1/seg2/seg3 rows persist weights (chained sources);
  scorer requires seg2/seg3/seg4 triples fail-closed; segSummary/
  classifySeg generalized (link-to-link deltas) + tested.
- 2026-10-31: Phase-E EXECUTED → **GO, SATURATING PARTIAL CONVERGENCE**.
  G1 join 1.00 x18; G0 train 0.815/0.833/0.814 (5th replication); G2a seg1
  mean 0.549 (4th replication); G2b unlearned flat; seg1 mechanism
  replicates (4th time). Trajectory (flipped means): 0.59→0.71→0.81→
  0.82 — all 9 links positive, seg3→seg4 increments collapse (+0.01–
  0.02): pair floors 0.79/0.87/0.81 (1 CONVERGED, 2 INTERMEDIATE-
  saturated). Prediction 0.84 vs actual 0.822 — gate-decline vindicated.
  Same-val 0.95 throughout (no erosion). 18 mains, all caps, `redone:
  []`. Tax = fast-shrinking then saturating residue; floor cue-set-
  dependent.
- 2026-10-31: Floor ATTRIBUTED (`docs/TURN_GATE_FLOOR_ATTRIBUTION.md`,
  read-only, zero worlds): the residue is EXTINCTION. Seg1 direction gap
  0.51 replicates x3 lines (ben→harm 0.80 vs harm→ben 0.29, n=50);
  ben→harm converges by seg2 (0.95), harm→ben stalls ~0.67 with seg3→4
  regressions (effective-n note); pair floors = composition; contact-
  dose counterexample rules out practice; within-seg1 ambiguity flagged.
  Intervention must target UNLEARNING (surprise-gated replay), not
  general plasticity. Next: extinction-targeted line under its own
  frozen plan — not started, no RSI claim.
- 2026-10-26: Phase-F FROZEN as `docs/TURN_GATE_PLAN_V1F.md` (DESIGN ONLY).
  Extinction-targeted surprise replay: 15 mains (train uniform + uniform
  seg1 gated + tournament-only + bundle + unlearned) on fresh bank
  411001–411054 (verified clean pre-freeze, 0 hits; re-verify at build).
  Machinery exists null-default (tournament/select, gain/boost needs
  EMA from surpriseGain>0, all metered); minimal-nonzero values (T2/G1/
  0.5 ladder, RSI-V1b precedent). Train uniform isolates the extinction
  window. Descriptive direction-aware flip-split (HB extinction subset
  pre-registered; BH ceiling no-claim); +0.1 meaningful band grounded in
  V1d increment; bundle VOID-condition + null-arm hygiene fail-closed.
- 2026-10-26: Phase-F IMPLEMENTED (`scripts/turn-gated-dev-v1f.mjs` +
  `tests/turn-gated-dev-v1f.test.mjs` 9/9 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-06/` built 411001–411054
  post-fixtures). Train uniform isolates extinction; options contrast
  fixture-guarded (tournament=base+1 key, bundle=base+3); scorer requires
  tournament+bundle triples fail-closed; direction-aware BH/HB splits +
  subsetGap + agentWork/sumManipulation tested; null-hygiene INVALID
  override + bundle VOID-condition in runner; BH ceiling no-claim kept.
  Bank test → post-build refusal + read-only checks.
- 2026-10-26: Phase-F EXECUTED → **GO, WEAK-POSITIVE (below band)**. G1
  join 1.00 x15; G0 train 0.819/0.823/0.812 (6th replication); G2a
  uniform mean 0.566 (5th replication); G2b unlearned flat; seg1
  mechanism replicates (5th time). Manipulation PERFECT: null arms all-
  zero (no INVALID), bundle fired 627 live + 497 replay boosts.
  Directional gaps HB: tournament +0.032/+0.051/+0.043 (mean +0.042),
  bundle +0.074/+0.043/+0.074 (mean +0.064) — 6/6 positive but below
  +0.1 band; same-val intact (~0.95), BH ceiling respected. Reading:
  mechanism ENGAGES (right process, silent nulls, intact retention) at
  INSUFFICIENT dose (~half segment-equivalent) → V1g escalates dose or
  changes mechanism (not abandonment); selection-vs-boost inconclusive.
  15 mains, all caps, `redone: []`. Cumulative 7590 (+15). Next: V1g
  dose-escalation under its own frozen plan — not started, no RSI claim.
- 2026-10-26: Phase-G FROZEN as `docs/TURN_GATE_PLAN_V1G.md` (DESIGN ONLY).
  Dose escalation + selection-vs-boost decomposition: 18 mains (train
  uniform + uniform seg1 gated + tournament-T3 + gain-only + bundle-
  strong + unlearned) on fresh bank 412001–412054 (verified clean
  pre-freeze, 0 hits; re-verify at build; base re-verified null).
  Full decomposition V1f could not resolve (gain-only = missing cell).
  +0.1 band FIXED (yardstick, not tuning); overdose reading
  pre-registered (< −0.05 + fired = destabilized, distinct from weak
  and void); manipulation VOID-conditions + null-hygiene carried over.
  Pre-registered STOP rule: sub-band with fired manipulation closes the
  surprise-replay line as exhausted (pivot, no treadmill). Cross-bank
  V1f numbers are context, not tests.
- 2026-10-26: Phase-G IMPLEMENTED (`scripts/turn-gated-dev-v1g.mjs` +
  `tests/turn-gated-dev-v1g.test.mjs` 9/9 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-07/` built 412001–412054
  post-fixtures). Tournament T3 + gain-only (1.0/3) + bundle (T3/1.0/3)
  options + per-arm transplants (train-source isolation kept) +
  scorer triple requirements incl. gain + BH/HB splits + subsetGap +
  agentWork/sumManipulation tested; null-hygiene INVALID override +
  bundle/gain VOID-conditions in runner. Bank test → post-build refusal
  + read-only checks.
- 2026-10-26: Phase-G EXECUTED → **GO, GAIN CLEARS BAR (borderline)**.
  G1 join 1.00 x18; G0 train 0.829/0.830/0.813 (7th replication); G2a
  uniform mean 0.612 (6th replication); G2b unlearned flat; seg1
  mechanism replicates (6th time). Manipulation PERFECT: nulls silent,
  gain fired 529+269, bundle fired 421+320, tournament structural.
  Directional HB gaps: tournament +0.095/+0.034/+0.070 (mean +0.066,
  below band — dose-responsive but insufficient); gain-only +0.149/
  -0.004/+0.168 (mean +0.104, CLEARS +0.1 — heterogeneous: pair 2
  zero); bundle +0.057/+0.009/+0.119 (mean +0.062, sub-additive:
  boost adds nothing on T3, breadth×depth interaction). No overdose
  (min -0.004), retention intact (|same| ≤0.007). STOP rule NOT
  triggered. Reading: gain-boost WORKS at dose (deploy + confirm in
  V1h, optionally with gain-seg2 compounding arm); selection alone
  insufficient; bundle over-narrows. 18 mains, all caps, `redone: []`.
  Cumulative 7608 (+18). Next: V1h gain deployment/confirmation under
  its own frozen plan — not started, no RSI claim.
- 2026-10-26: Phase-H FROZEN as `docs/TURN_GATE_PLAN_V1H.md` (DESIGN ONLY).
  Gain deployment + confirmation with compounding: 15 mains (train +
  uniform gated + gain-only (V1g-identical values, HELD not tuned) +
  gain-seg2 cumulative-boosted + unlearned) on fresh bank 413001–413054
  (verified clean pre-freeze, 0 hits; re-verify at build). D1-replication
  HB(gain)-HB(uniform) >+0.1 expected (same fixed yardstick); D2-
  compounding (no band, first measurement); D3-deployment reported.
  Pre-registered stop rule BOTH ways: D1 < +0.1 with fired manipulation
  CLOSES surprise-replay as non-robust (V1g borderline falsified) →
  pivot to non-replay mechanisms, no further escalation without new
  rationale. Gain-seg2 void-with-seg1-fired noted as informative.
  Pair-2-zero heterogeneity re-examined (reported, not gated). Next:
  implement, then single attempt.
- 2026-10-26: Phase-H IMPLEMENTED (`scripts/turn-gated-dev-v1h.mjs` +
  `tests/turn-gated-dev-v1h.test.mjs` 9/9 green; triage at 6-pristine
  baseline; bank `evidence/turn-gated-dev/fresh-08/` built 413001–413054
  post-fixtures). Uniform train isolates extinction window; gain opts
  HELD-identical (base+2 @1.0/3, V1g values, fixture-guarded) +
  gain-seg2 chained transplant (sources gain, terminal self); scorer
  requires gain + gain-seg2 triples fail-closed; BH/HB splits +
  subsetGap + agentWork/sumManipulation tested; null-hygiene INVALID
  override + per-gain-arm VOID-conditions in runner. Bank test →
  post-build refusal + read-only checks. Next: single authorized
  attempt.
- 2026-10-26: Phase-H EXECUTED → **GO, GAIN REPLICATES + COMPOUNDS**.
  G1 join 1.00 x15; G0 train 0.812/0.813/0.819 (8th replication); G2a
  uniform mean 0.644 (7th replication); G2b unlearned flat; seg1
  mechanism replicates (7th time). Manipulation PERFECT both arms
  (gain 628+308, seg2 424+428 fired; nulls silent; no voids).
  D1 +0.187/+0.098/+0.116 (mean +0.134 ≥ +0.1, REPLICATED — pair-2
  zero becomes positive, spread tightens); D2 +0.184/+0.324/+0.271
  (mean +0.260, COMPOUNDS ~2x first-segment gain); D3 +0.371/+0.422/
  +0.386 (closes ~55% of same-val gap). Same-val intact (|Δ| ≤ 0.011).
  No overdose, no voids. STOP rule NOT triggered. Reading: surprise-
  gating is a replicated compounding extinction lever (harder flips
  this bank: 0.24 vs 0.41 — replication across difficulty). Next: V1i
  gain-seg2 vs uniform-seg2 (clean interaction test), then CLOSE the
  transfer arc as answered — not started, no RSI claim.
- 2026-10-26: Phase-I FROZEN as `docs/TURN_GATE_PLAN_V1I.md` (DESIGN ONLY;
  FINAL chartered transfer experiment — line CLOSES after V1i's verdict).
  Boost×exposure interaction at matched 2x: 18 mains (train + uniform
  seg1 gated + uniform seg2 + gain seg1 + gain-seg2 + unlearned) on fresh
  bank 414001–414054 (verified clean pre-freeze, 0 hits; re-verify at
  build; gain values HELD-identical to V1g/V1h). D0-replication (>+0.1,
  3rd measurement) + E1-interaction (>+0.1, headline, exposure-matched)
  + E2/E3 trajectory replications (no band, contextual) + per-arm VOID
  (seg2-void-with-seg1-fired informative) + null-hygiene INVALID.
  Pre-registered outcomes: E1>+0.1 deploys boost at 2x; E1≈0 bounds it
  to 1x acceleration; E1<−0.1 cautions (late overdose); any VOID leaves
  that comparison unanswered. No V1j licensed.
- 2026-10-26: Phase-I IMPLEMENTED (`scripts/turn-gated-dev-v1i.mjs` +
  `tests/turn-gated-dev-v1i.test.mjs` 9/9 green (incl. triple-held gain
  fixtures + scorer triple requirements + BH/HB + manipulation +
  per-arm VOID plumbing); triage at 6-pristine baseline; bank
  `evidence/turn-gated-dev/fresh-09/` built 414001–414054 post-fixtures.
  Uniform + gain seg1 rows persist weights (chained sources); scorer
  requires uniform-seg2 + gain + gain-seg2 triples fail-closed;
  null-hygiene INVALID covers uniform-seg2 (null arm) + per-arm gain
  VOID-conditions in runner. Bank test → post-build refusal +
  read-only checks.
- 2026-10-26: Phase-I EXECUTED → **GO, E1 CONFIRMS; LINE CLOSED AS
  DEPLOYED**. G1 join 1.00 x18; G0 train 0.816/0.818/0.808 (9th
  replication); G2a uniform mean 0.654 (7th transfer replication); G2b
  unlearned flat; seg1 mechanism replicates (8th). D0
  +0.317/+0.101/+0.054 (mean +0.158, clears band); E1 +0.224/+0.130/
  +0.136 (mean +0.163, ALL clear band — headline CONFIRMED, no V1j);
  E2 +0.053/+0.156/+0.243 (replicates V1d); E3 −0.040/+0.185/+0.271
  (pair-1 saturates near its floor). Manipulation PERFECT (nulls
  silent incl. uniform-seg2; both gain arms fired; zero voids).
  Retention intact (|Δ| ≤ 0.011). Cumulative 7626 (+18). TURN-GATE LINE
  CLOSED per frozen plan: 8 GO verdicts, replicated mechanism,
  attributed floor, deployed surprise-gated replay. No V1j.
- 2026-10-26: Post-closure analytic (`docs/TURN_GATE_CONCENTRATION.md`,
  read-only, zero worlds; line stays CLOSED): error mass concentrated in
  ~3 HB cues (top-1 26–43%, top-3 69–81%, top always HB 6/6 pairs);
  concentration persists under gain (no flattening); top identity shifts
  in 2/3 pairs (whack-a-mole) → cue-targeted boosting NOT licensed
  (moving targets); global surprise-gating stays the instrument; floor =
  hardest-cue residue. Last analytic step before any structural line:
  what makes the hardest HB cue hard.
- 2026-10-26: practice adjudication (read-only, 0 worlds) → HB gradient
  +0.5 robust BUT BH −0.75 proves exposure endogenous (totals can't
  identify practice effects); gain lifts +0.13 with ZERO gradient change
  (0.67→0.68) → manipulable floor is contact-orthogonal. Noisy replay
  NOT licensed (wrong-signed); naive exposure-extension NOT licensed
  (confounded + saturated). No new line. Next: codebook-geometry vs
  correctness (read-only, specified not executed). Cumulative unchanged.
- 2026-10-26: geometry INCONCLUSIVE (dConflict r=-0.20 wrong-signed;
  dCarry +0.18 too weak; dense codebooks limit test) → perceptual line
  NOT licensed. QD transfer map built (33 episodes, 7/25 cells): BH>0.4
  region EMPTY (BH≈0.20 everywhere = binding constraint, worse than HB
  floor); frontier trades off (best HB 0.65 ↔ worst BH 0.13); gain holds
  HB frontier only; 7 elites archived (anti-herding substrate for future
  selection lines). Specified (not executed): BH failure actor-side test
  via per-cue values (needs new instrumentation). No line licensed.
- 2026-10-26 CORRECTION: V1 scorer inverted BH behavior (1-turn vs
  turn); fixed + rescored frozen rows (gap 0.914 -> 0.086, sums to 1.0)
  → verdict INDETERMINATE (not actor/learner). Threshold license
  WITHDRAWN. Bank-dependence finding: BH 0.83 here vs 0.20 line
  (priors/exposure/intake/engine ruled out; thirds 0.76→0.94 fast from
  start; timing untestable frozen — first-contact logging specified)
  → floor partly ecological.
- 2026-10-26 prior-strength dissociation (TURN_GATE_PRIOR_STRENGTH.md,
  0 worlds): overshadowing NULL (concentration +0.08, anchor +0.05) →
  Kamin top-move fails; LI/PH split (HB partial −0.17 vs BH +0.54, LOO
  0.48-0.58 robust) → negativity-bias unification; BH actor-side doubly
  licensed; HB mixed; two-track program specified (value-side HB line vs
  actor-side BH line). No line licensed by analysis alone.
- 2026-10-26 CORRECTION (same BH-inversion as VALUE-PROBE): BH numbers
  above were 1-turn (inverted). TRUE: BH correctness 0.72-0.88 everywhere
  (no BH floor — floor is HB-only 0.16-0.47); BH contact gradient +0.75
  (anti-endogenous: practice evidence, not exposure-follows-behavior);
  BH train-contact partial -0.54 (LI-like, stronger than HB -0.17) →
  LI is direction-general, PH half retracted. BH actor-side WITHDRAWN
  (no phenomenon); associability-reset now covers BOTH directions;
  HB value-lead (behavior 0.49 ahead of values 0.22) is the open
  value/behavior question. Frontier tradeoff WITHDRAWN (r(HB,BH)=+0.16).
  (Docs rewritten: PRACTICE_ADJUDICATION, QD_MAP, PRIOR_STRENGTH,
  LOSS_AVERSION caveat, map correction log 2026-10-26.)
- 2026-10-26 niche fingerprint (NICHE_FINGERPRINT.md, 0 worlds):
  1-NN niche-ID 1.000 pre-test (720/720; weights ARE niche models);
  57% own-train retention post-test (one segment erases half; test-
  niche 0/72 degenerate — no test-trained reference exists). V1 null
  = selection missing, NOT fidelity loss (transplant starts at 100%).
  Prescription: mating rows must snapshot weights (fingerprint-under-
  mutation then measurable). Bank-distinguishability necessary but
  insufficient for HB variance.

## V1j (lossy-tutoring transplant; FROZEN 2026-11-02, design only)

- Plan: `docs/TURN_GATE_PLAN_V1J.md` (reopens CLOSED-AS-DEPLOYED line on
  new rationale: artifact-control, not boost — exact-copy transplants may
  over-preserve; Kirby/R92/R101 lossy-tutoring prediction; α=0.5 single
  constant; train/exact/lossy/unlearned × 3 pairs = 12 mains; GO iff
  flipped lift ≥ +0.1 with same-val floor ≥ 0.5; bank 418xxx; re-closes
  either way as artifact-control annex).
- Pair family + verdict shape mirror V1d (yardstick bars frozen-identical);
  spent = MLR1 full-union list + own 418 appended.
- Implement: separate turn under the plan (transplant-shrinkage + 12-ish
  fixtures + triage + fresh-10 bank 418001–418054); single attempt next.
  Cumulative unchanged (7959, design only, zero worlds).

## V1j (lossy-tutoring transplant; EXECUTED 2026-11-02 → GO, line re-CLOSED)

- Attempt-10 (single, authorized): 12 mains / 0 probes / 1.90e9 ops, clean
  pass (ledger exact, `redone: []`, G1 join 1.00, G0 train 0.82, G2a exact
  mean 0.51, G2b unlearned flat, gLift/gFloor true).
- Verdict: **PHASE-J-GO** (mean flipped lift +0.1324 ≥ +0.1 on all 3 pairs;
  same-val lossy 0.9447 ≈ exact 0.94–0.95 — retention real, exact-copy
  adds inert fidelity; shrinkage regularizes transfer).
- Re-prices V1b–V1i: same-val/niche-ID confirmed real BUT exact-copy
  over-preserves (future retention claims must use lossy/noisy transplants;
  exact-copy is the upper-bound control). V1i deployment stands
  (complementary mechanisms). R101-amendment separator did its job.
- Results: `docs/TURN_GATE_RESULTS_V1J.md`. Cumulative program spend:
  7971 (+12). No V1k without new rationale.
- 2026-11-02: Phase-K FROZEN (`docs/TURN_GATE_PLAN_V1K.md`, new rationale:
  measurement V1 HB +0.234 vs BH +0.01) + IMPLEMENTED (direction-gated scorer,
  10/10 fixtures, triage 978/7 zero-new, fresh-12 bank 448001-448054 built;
  bookkeeping CORRECTION attempt-12/fresh-12, damage owns 11) + EXECUTED →
  **GO**. All gates true (G2a-HB +0.2155 ≥ +0.1, 3/3 pairs; BH 0.848 ≥ 0.7;
  same 0.947; G0 0.815-0.827; G2a 0.525). HB 0.372→0.588 (treatment, not cure);
  overall lossy tax 0.118 (M4 trigger 2 unfired). Prediction calibrated to
  0.02. M2-across wound-has-treatment CONFIRMED; line re-CLOSED (no V1l
  without new rationale). Cumulative 8037 (+12). No RSI claim.
- 2026-11-02: Phase-L FROZEN (lossy-once seg-chain: cure-vs-palliative) +
  IMPLEMENTED (5-arm chain, 13/13 fixtures incl. structural-order guard +
  mains-cap check, triage 988/8 zero-new, fresh-13 bank 449001-449054) +
  EXECUTED → **GO**. HB-seg3−seg1 +0.254 (3/3; seg1 0.587 = V1k replica,
  seg3 0.841 ≈ train 0.825); BH 0.950, same 0.951; G0 0.82-0.84; 15/0/2.44e9
  redone[]. Cure direction (transient, not structural). M2-across upgraded
  treatment→CLOSING (verdict-doc revision flagged, not silently edited).
  Execution incident preserved (exact-arm slip + mains-constant slip, both
  fail-closed, void run removed, regressions fixture-guarded). Line re-CLOSED
  (no V1m without new rationale). Cumulative 8052 (+15). No RSI claim.
- 2026-11-02: Phase-M FROZEN (shrinkage dose ladder {0.25,0.5,0.75};
  MET-bar shot) + IMPLEMENTED (dose loop, MET-gated scorer, 13/13
  fixtures, fresh-14 bank adopted-verified) + EXECUTED → **GO**.
  HB(α): 0.25→0.914 / 0.5→0.532 / 0.75→0.360 (monotone; exact 0.288,
  4th wound replication); bestHb 0.914 EXCEEDS train 0.81 (bar 0.71,
  cleared by 0.20); BH ~0.82 unharmed; same ~0.94 retained. 18/0/2.91e9
  redone[]. M2 flips to MET (addendum V2, bar applied verbatim).
  Line re-CLOSED (no V1n without new rationale). Cumulative 8070 (+18).
  M4 trigger 2 explicitly unfired (wrong measurement class). No RSI claim.

## V1n (dose-peak mapping, 2026-11-02): PHASE-N-GO, line CLOSED
Fresh-15 (453001-453054) spent, attempt-01 21/0/3.499e9 redone[]. Peak is a
plateau: HB 0.950/0.953/0.951/0.951/0.934 across 0.05-0.25 (all +0.11-0.13
over train 0.824); argmax 0.1 descriptive. 0.25 replicates V1m to 0.02.
Dose-response complete 0.05-0.75 (plateau then step down). No second attempt.
Cumulative 8103 (+21). No RSI claim.

## V1o (multi-codebook training, 2026-11-02): PHASE-O-INCOMPLETE-UNTRAINED, line CLOSED
Fresh-15 (470001-470054) spent, attempt-15 15/0/2.49e9 redone[]. G0 fail:
train-multi 0.667/0.365/0.508 (pair 2 at 0.365) vs train-single
0.820/0.814/0.815 — mid-training codebook switches interfere, not enrich.
Descriptive lift +0.0404 (3/3 non-degraded, misses +0.10) ungated. Family
#2 simplest form UNTESTED (not NOGO). No second attempt.
Cumulative 8118 (+15). No RSI claim.
