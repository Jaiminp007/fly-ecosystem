# TRANSFER MECHANISM MAP V1 (what lifts besides lossy)

Date: 2026-11-02. Zero worlds. Follows SYNTHESIS ADDENDUM V4's
reframe (open question is now transfer-side). Tried mechanisms
with verdicts; predicted-null extensions (predictions, NOT
verdicts — never run, never claimed); what would license new work.

## Tried (measured lifts, closed)

- Surprise-gated gain (live+replay mix): +0.10–0.26, DEPLOYED
  (V1h/V1i). Mechanism: extinction (replays high-error records).
- Lossy transplant α=0.25 (plateau 0.05–0.25): +0.13–0.26,
  DEPLOYED (V1j/V1l/V1m/V1n). Mechanism: unlearning (shrinks
  preserved avoidance). Replicates on fresh banks (C15 exact
  0.31/0.62 vs lossy 0.95/0.91).
- Threat-gated replay (TS): flat (+0.004), NOGO (acquisition-side,
  engaged-but-inert).
- Damage-gated replay (DAMAGE-GATE): flat (+0.015), NOGO.
- Dose curve (V1m/V1n): monotone shrinkage, plateau ~0.95, no peak
  (variance ~0.02 — no interior optimum to exploit).
- Rate dial 2.0 (C12): null (−0.05/+0.02, update-rule family null).
- Sparse mask 0.5 (C14/C15): null on exact (−0.04/−0.02), zero on
  lossy (−0.004/−0.016). Target-selection closed.

## Predicted-null extensions (NOT run, NOT verdicts — predictions)

- Sparse × lossy (mask on working transfer): predicted null by
  C14 (mask null) + C15 (operators add zero to lossy) jointly.
  Filed as prediction so nobody spends a bank testing it without
  a new rationale.
- Per-parameter rates × lossy: same joint logic, predicted null.
- Threat/damage × lossy: acquisition-side mechanisms on a
  transfer already fixed — predicted null (wrong side of the
  wound).

## Addendum 2026-11-02 (R348: input-side locus + TTA taxonomy)

- New LOCUS (Guo/diffusion-TTA): adapt INPUTS (transform target
  toward source) instead of weights. Every mechanism in the map
  above is weight-side (gains/scales/masks/transplants all rewrite
  weights or their updates). Input-side is outside that locus —
  the first such idea on record. UNLICENSED (needs a generative
  model of the train world = substrate work) but it re-partitions
  the hunt: weight-side (mapped, largely closed) vs input-side
  (unmapped, one candidate).
- R363 addendum: input-side family grows 1→5 — Mummadi
  input-transformation (the original TTA), Gao DDA (project to
  source = our transfer restated), Zhang BETA (black-box
  input-space, matches our constraint shape), Lee BECoTTA
  (input-dependent blending, DTR-relevant). ALL unlicensed (each
  needs machinery: transform, generator, steering model,
  experts). Locus stands: unmapped, five candidates, zero lines.
- TTA taxonomy (Liang survey) adopted as the hunt's map: update
  weights/statistics (tried) vs adapt inputs (untried) vs adapt
  prototypes (ProtoTTA — closest analog to niche-model weights;
  needs a prototype-update rule, unlicensed).
- sTTT (Su) names our transfer setting (sequential inference +
  adaptation) but does not change the C14-bar ruling on test-time
  firing (protocol framing; same channel).

## Wound lenses (recorded, not mechanisms — no line follows from a lens alone)

- Extinction failure (CONFIRMED working lens): lossy + surprise-gated
  both work by unlearning preserved avoidance; direction exclusivity
  (HB-only) supports it; adoption-decline tracks it.
- Shortcut failure (R353/Wei: TESTED 2026-11-02, REJECTED in strong
  form): train rows turn 0.866 on harmful vs 0.049 on beneficial
  cues (n=492+492, pooled C2–C15) — behavior tracks labels, not
  cues. Agents learn the rule; the wound is pure failure-to-unlearn
  (see SHORTCUT_AUDIT_V1). Subtler cue-threshold variant untested.
  Extinction lens stands alone.
- Rigidity framing (R357/Gu ERI): the literature's name for the same
  wound — inherited weights biasing reuse toward prior-satisfying
  features (Einstellung), rigidity DISTINCT from forgetting. Our HB
  gap is one instance of the class. Framing only (no measure
  computed here, no mechanism follows).
- Different spaces (R381/Hu VQ-CD): continual RL across DIFFERENT
  observation/action spaces — names our setting (codebook = different
  space). Precedent, not a line (needs diffuser machinery).
- Arbitration failure (R371/Nooralahzadeh: NEW lens, untested):
  encodes the evidence yet answers from the prior. Compatible with
  extinction/rigidity (the prior IS the preserved mapping); adds
  the arbitration question (who wins: prior or evidence). Hafez
  reliability-arbitration banked as a candidate mechanism
  (unlicensed: needs model + reliability estimate).
- Arbitration mechanisms (R373): Fard classic STATES the wound
  (habit = automated previously-rewarded actions, inflexible when
  environments change — filed as the canonical description);
  Jang ensemble-arbitration, Shan Pavlovian-hybrid (contextual CS),
  Lin source-reasoning (+correlation bias) all banked UNLICENSED
  (need ensemble/arbitrator, hybrid machinery, source model).
- Convergent precedent + tension (R361): MedEinst's control+trap
  with flipped evidence ≅ our train/flip-split + HB gap (kin, not
  a line); but context-change OVERCOMES mental set in code
  (Sergeyuk) while our codebook-change does NOT overcome our wound
  — filed as tension, modality/scale difference, not a mechanism.

## What would license transfer-side work

A mechanism aimed at HB-extinction with a rationale NEITHER gain-
modulation NOR target-selection NOR transplant-scaling — i.e., a
third unlearning mechanism (surprise and lossy are two; threat was
the third candidate and failed). The bar: direction-first (targets
HB specifically), falsifiable both ways, fresh bank, PLUS the R359/Shi caution (any
unlearning-based line must check the Nth unlearning still works —
continual unlearning can collapse forget-ability itself). None known —
the map stays open, not empty.
- R366 addendum: FIRST CANDIDATE RATIONALE (not a line): latent-cause
  inference-gating (Song/Lu) — infer the new codebook as a new cause,
  gate avoidance by cause. Genuinely new family (not gain, not
  selection, not scaling). Needs a frozen plan + fresh bank to run;
  direction-first and falsifiable-both-ways must be IN the freeze.
- V1O addendum (2026-11-02): family #2's simplest form ran INCOMPLETE-
  UNTRAINED (multi-train G0: 0.667/0.365/0.508; mid-training codebook
  switches act as interference, not enrichment, within 1792 ticks).
  Question UNANSWERED (not NOGO): future multi-codebook lines must
  solve multi-train learning first. Descriptive lift +0.0404 (3/3
  non-degraded, misses +0.10) recorded, ungated.
- C16 addendum (2026-11-02): family #1's simplest form ran NOGO —
  the vote never fired (L +4402..+10646 vs K=8; same-val confirming
  drowns flipped surprise 8:1). CLOSED with reason (vote dilution);
  a flipped-conditional vote would be a NEW variation needing its
  own freeze. Lossy HB 0.91–0.95 replicates the working baseline.
- R385 addendum: C16-successor design filed (Mouchon: frozen-
  encoder + surprise-gate + consolidation — flipped-conditional
  vote + write + consolidate; closest working architecture,
  unlicensed). DISRC (surprise-scaled updates) + dynamic-gain
  neuromodulation (stability gap = seg tax, gain thread made
  dynamic) banked as unlicensed variants.
- R387 addendum: Schillaci congruency (keep-what-fits via
  generative prediction error; embodied transfer shown) joins
  as the consolidation-side twin of the surprise-gate;
  CraniMem (gated-bounded) + 3-level Hebbian controller banked
  unlicensed.
- R389 addendum: Le surprise-NOVELTY (count novel surprise, discount
  familiar confirming — memory retrieval errors) joins as the
  dilution antidote for the successor vote; NEMORI (retention by
  predictability) + hypothesis-cascade (errors compound) banked
  unlicensed.
- R391 addendum: Wan max-discrepancy (not pooled sums) filed as THE
  dilution fix for the successor vote; drift-prototypes + Meta-ADD
  (learned drift typing) + HHT (type-then-adapt) banked unlicensed.
- R393 addendum: Halstead fingerprinting (stationary-concept
  representations + recurring-concept alarm = flip-back detector)
  filed; unified drift+forgetting survey Joins the map's reading
  list; Ayers GoF + Sharma cross-domain prototypes banked unlicensed.
- R395 addendum: MICE recall-or-relearn (cut-at-change + merge-or-store
  by error, training-free) filed as the transfer-chain operator;
  Halstead relevance-gating + evolution-pool (no replay) + reuse-selection
  bottleneck banked unlicensed.
- R437 first-form: input-side adaptation HAS its first concrete
  machinery (Danda input-side adapter + quantile matching);
  distilled-not-replayed staleness twin; decoupled prototype
  loss; cache-budget warning. Route to unmap, needs freezing.
- R439 mechanism postures: Hess co-observation = the tax's third
  name (legs never co-observe); Masana carry-sufficiency twin
  (preserve-first is right-shaped); Zhu rank-not-means diagnostic.
- R441 core tension (MuLoRA): protection ≠ responsiveness —
  carrying weights preserves history but does NOT keep capacity
  alive; plasticity loss rides NTK rank decrease (Tang churn
  dial; Prakash/Wu e-rank diagnostics). The wound restated.
- R443: frozen+delta HAT-TRICK (Kang joins RAEGL/Sandwich);
  selection-failure is the universal tax (G2b floor, Park); the
  agent harness that revises (ReHarness) is our loop's shape —
  unlicensed, filed.
- R445 calibration family: T-Cal adjudicates the near-misses
  (C6/C13 noise-at-bar BY CONSTRUCTION — optimal test for
  real-vs-noise); Qiao distance-from-calibration lens; Li/Dang
  fixes unlicensed.
- R447 carry-without-past family (rehearsal-free): composition
  is the transfer mechanism not the vault (MoCL-P instance);
  efficiency is the other budget (REP); contrastive task-free
  unlicensed.
- R449 RSI-adjacent family: Recuris NAMES RSI-hard + evidence-
  localized failures; MoLEM states update-vs-memory (= weights-
  vs-carry) dilemma; Hippocam/Executive unlicensed.
- R451 keep-less-prove-more: CoP2L certification twin;
  condensation antidote-shape; uncompressible selection twin;
  unequal-points (heterogeneity twin). Selection file grows.
- R453 smart memory: frozen geometry 4×-CONFIRMED (CARES);
  decoupled store (TEM); density-not-samples; keep-the-wounds
  (KDF+ HB-legs twin). Memory file: coverage+density+
  difficulty, not recency.
- R455 minimal mechanisms: frozen+delta 5×-CONFIRMED (PACE);
  savings > accuracy (Zhou lost-vs-inaccessible twin); smallest
  delta (norms-only); shift-benchmarks > static bars
  (SkillShift three-shifts twin).
- R457 protection-by-direction: GPM classic; null-space
  prompts; NESS leftover-capacity (wound, geometrically);
  PLASTIC first-session-frozen = our chain shape + named
  failure mode.
- R459 two timescales: FSA-first STRONG baseline (our shape
  embarrasses fancier); SAFE slow-fast; DualNet CLS (fast
  votes, slow carries); Tiwari update-vs-carry LLM-side.
- R461 bounded state: InduceKV footprint twin (backbone
  unchanged, delta externalized); Wan op-cap twin (spend
  where the wound is); NSR lifecycle twin (compress→reserve
  →recall→reallocate = our bank discipline); preempt
  unlicensed.
- R463 unseen transfer: transport-valuation (hidden channels
  in moments); transfer-is-a-MATRIX (heterogeneity,
  formalized); mid-chain tracking (watch legs mid-chain);
  compatible-heads (compatibility twin).
- R465 control the unseen: direction-drift (steer direction
  not data); attribution-fails (honest negative); channel-
  LOCATION (wound's address: HB); consensus (majority-vote
  twin).
- R467 structured consensus: purification many→one
  (carryover twin); axiomatic weighting (copier-weights
  formalized); dual decoupling (store-vs-weights twin);
  Bayesian priors unlicensed.
- R469 purification: null-space 3× (cleanse use); test-time
  cleanse; sharp-minima wound signature (sharpness twin);
  detect-then-unlearn (flip-split+lossy twin).
- R471 geometry file: flat transfers, sharp sticks, noise
  escapes (FLAD/Koster/C-Flat/Ibayashi); sensitivity-
  stability = plasticity-retention.
- R473 escape file: noise-shape/tail/recipe/late-SAM;
  late-flattening twin (lossy transplant = late
  flattening?).
- R475 forgetting file: reasonable > none (lossy twin);
  unlearn-bad-alignments (removal twin); discard-required
  (stratified); share-reasoning (sharing twin).
- R477 portability file: reusability metric (heterogeneity
  twin); procedural generators (bank twin); patch carries
  (transplant twin); latent channels (carry twin).
- R479 synthetic file: generate-the-test (bank twin);
  breadth-with-knobs (diversity twin); simple-grows-modules
  (developmental twin); abstract-first (curriculum twin).
- R481 circuits file: upper-bounds-not-vibes; propose-
  dispose pipeline (loop twin); edit-the-circuit (sparse
  twin); bound-the-capability (bounds twin).
- R483 edit-hold file: edit-then-consolidate (loop twin);
  sparse-lifelong (sparse twin); drift>tolerance
  (tolerance twin); conflict-resolving (optimizer twin).
- R485 module-carry file: dedicated residual (module twin);
  compress-carry + probe-contract (digest twin); edit-
  survival (survival twin); subspace alignment unlicensed.
- R487 new substrates: KAN wound-unclear (substrate
  twin); structure-resists-overwrite (structural twin);
  per-knot anchoring (granularity twin); aligned injection
  (adopt-iff twin).
- R489 infusion file: keep-general dilemma; freeze-
  original adapters (adapter twin); survey reference;
  retention-aware (adopt-iff twin).
- R491 prior file: preserve-then-adapt (session twin);
  measure-the-infusion (benchmark twin); init-from-prior
  (init twin); partition-then-mix (mixture twin).
- R493 store-apart file: flexibility-integration trade-off;
  decouple-store-from-path (TEM seconded); retaining-is-
  risking (risk twin); selective-share (federated twin).
- R495 poison file: origin-bound (provenance twin);
  guard-formation (bank-build twin); environment-writes-
  memory (interface twin); sleepers-wake-late (sleeper
  twin).
- R497 interface file: standardize-ops + governance
  (interface twin); test-formation (seconded); serve-
  future (carry twin); append-only (discipline twin).
- R499 governance file: revocable-validity (revocation
  twin); mechanical-audit (audit twin); failure-aware
  (maintenance twin); what-currently-holds (meta twin).
- R501 verbs file: propose-verify-commit (verbs twin);
  write-time reconciliation (reconciliation twin);
  anticipate-not-archive; structural verification
  (instrument twin).
- R503 verify file: naming≠computing (audit twin);
  carry-the-proof (proof twin); cover-don't-target
  (density twin); locate-reliability (separation twin).
- R505 evolve file: density-budget (budget twin);
  adapt-effort (spend-where-wound seconded); distill-
  trajectory; negatives-teach (uncertainty twin).
- R507 failure file: failed→signals (signals twin);
  failed-prefix (leg-carry twin); recover-by-instruction
  (recovery twin); edit-the-harness (harness twin).
- R509 harness file: tamper-audit (tamper twin);
  causal-guard (guard twin); trust-no-hook (security);
  govern-context (govern twin).
- R511 govern file: metacognition-framework (framework
  twin); generated-vs-governed (state twin); monitor-
  control (control twin); delayed-appraisal (vigilance
  twin).
- R513 trust file: conditional-trust (conditional twin);
  trust-by-design (design twin); explain-routes (ledger
  twin); decouple-learning-authority (invariant twin).
- R515 program file: formalize-irreversible (formalism
  twin); recoverable-flow; harness-in-code (source twin);
  audit-programs (program twin).
- R517 instrument file: hold-fixed-vary-axes (control
  twin); preserve-observable; untangle-runaway
  (discipline twin); atomic-history (history twin).
- R519 history file: missing-has-kinds (provenance twin);
  entangled→reusable (repair twin); failures-are-causal
  (causal twin); one-task-per-commit (atomic twin).
- R521 reuse file: transform-failures (signals twin);
  stair-plans (stair twin); verify-reuse (adopt-iff
  twin); compare-hierarchically (leg twin).
- R523 analogy file: analogy-not-identity (analogy twin);
  compare-movement (semantics twin); distance-catalog
  (reference); body-by-analogy (body twin).
- R525 embodiment file: share-physics-specify-body;
  motif-transfer (motif twin); zero-shot-physics;
  learn-suboptimal (universal priors).
- R527 physics file: share-space; borrow-mechanics
  (classic twin); share-geometry; move-first (decompose
  twin).
- R529 execute file: competence≠execution (gap twin);
  measure-embodied; align-hierarchically; decouple-plan
  (plan twin).
- R531 doing file: belief≠doing (belief twin);
  refine-trajectory; attribution-or-simulation
  (simulation twin); say≠do (structural twin).
- R533 refine file: closed-loop (control twin);
  round-detection (triage twin); reshape-mass;
  detection-to-fix (pipeline twin).
- R535 operations file: stratify-freshness;
  evolve-proactively; correct-directly (human twin);
  remember-after (ledger twin).
- R537 test-time file: amortize-retrieval;
  benchmark-evolution; reflect-failures;
  bank-reasoning (bank twin).
- R539 experience file: abstract-composition;
  graph-experience (trainable twin); reflect-misses;
  graph-corrections.
- R541 governance file: reuse-with-evidence;
  expect-collapse; rollback-keep;
  anchor-externally.
- R543 co-evolution file: propose+solve;
  reward-movement; carry-to-win;
  co-evolve-frame.
- R545 fast-slow file: stabilize-alignment;
  name-unlearning; split-speeds;
  manage-lifecycle.
- R547 externalize-and-guard file: mechanize-assurance;
  audit-co-cheating; layer-supervision;
  externalize-with-evidence.
- R549 reward-trust file: correct-confounds;
  think-critically; credit-steps;
  audit-adversarially.
- R551 credit file: credit-retrieval;
  separate-skill; cite-turns;
  decompose-trajectories.
- R553 history-trust file: remove-misleaders;
  compress-when-safe; distrust-plausible;
  select-past.
- R555 attribution file: test-mechanisms;
  blame-sources; cite-contexts;
  trace-payloads.
- R557 forensics file: tag-paths;
  augment-tools; sleuth-wreckage;
  stage-verdicts.
- R559 operations file: automate-guides;
  operationalize-indicators; model-evidence;
  search-resolved.
- R561 assurance file: ledger-fragments;
  assure-scope; synthesize-beyond;
  verify-experience.
- R563 governance-limits file: bound-expressiveness;
  mind-gaps; think-first;
  enrich-codebooks.
- R565 reliability file: measure-four-ways;
  test-preconditions; anticipate-needs;
  rank-specialization.
- R567 stress file: score-stability;
  climb-ladders; bench-three-ways;
  anchor-then-probe.
- R569 failure file: inject-faults;
  bind-approvals; audit-evaluators;
  reflect-structurally.
- R571 approval file: guard-loops;
  name-approvals; card-ground-truth;
  verify-before-fixing.
- R573 traces file: layer-oracles;
  distrust-traces; test-paths;
  survey-provenance.
- R575 hidden-failures file: separate-layers;
  audit-corpora; seek-signals;
  trace-facts.
- R577 composition file: probe-boundaries;
  audit-writes; test-assembly;
  build-strategies.
- R579 experience-opt file: freeze-successors;
  generate-entries; distill-reusable;
  reuse-selectively.
- R581 compression file: engineer-context;
  sleep-consolidate; verify-compaction;
  compress-risk.
- R583 closed-loop file: reset-pairs;
  close-loops; ground-achievements;
  rectify-on-policy.
- R585 audit-layer file: measure-routes;
  pay-disagreements; bound-deployments;
  shield-executions.
- R587 skill-budget file: format-specs;
  virtualize-state; allocate-by-skill;
  modularize-knowledge.
- R589 incomplete file: rank-signals;
  specify-sources; fuse-debates;
  evaluate-holes.
- R591 beyond file: assume-behaviorally;
  reward-self; specify-patterns;
  deploy-focused.
- R593 self-knowledge file: verify-intrinsically;
  invary-policy; catch-strain;
  stop-early.
- R595 from-within file: probe-steps;
  read-states; guard-within;
  criticize-self.
- R597 anchoring file: anchor-relatively;
  compare-relatively; ground-steps;
  repair-reasoning.
- R599 unified file: unify-skills;
  standardize-memory; unify-models;
  disentangle-latents.
- R601 governed file: govern-memory;
  factory-pipelines; replay-longitudinally;
  meter-cross-layer.
- R603 measurement file: compress-buffers;
  condition-evals; validate-instruments;
  diversify-gates.
- R605 as-served file: meet-served;
  compose-safely; request-real;
  run-live.
- R607 boundaries file: bound-actions;
  taxonomize-misbehavior; watch-aggregates;
  guard-sessions.
- R609 cross-session file: watch-accumulation;
  govern-capabilities; select-temporally;
  persist-memory.
- R611 woven-memory file: pair-scenes;
  separate-stores; weave-hybrids;
  lighten-structures.
- R613 fusion-memory file: fuse-signals;
  loop-evidence; consolidate-by-usage;
  mosaic-memory.
- R615 symbolic-memory file: lean-context;
  ground-temporally; step-symbolically;
  solve-logically.
- R617 neuro-symbolic file: gate-structurally;
  route-experts; ground-mechanistically;
  constrain-handoffs.
- R619 epistemic file: recruit-capability;
  floor-trust; govern-consolidation;
  contract-gates.
- R621 propose-dispose file: dispose-by-proof;
  verify-modularly; correct-traces;
  search-don't-teach.
- R623 audit-trail file: defend-counterfactually;
  localize-origins; audit-by-humans;
  canonize-actions.
- R625 grounded-self file: ground-loops;
  evolve-physically; optimize-harnesses;
  guide-by-traces.
- R627 counterfactual file: preserve-what-matters;
  twin-rollouts; isolate-choices;
  bandit-fairly.
- R629 preservation file: check-worlds;
  preserve-tokens; ground-visuals;
  minimize-edits.
- R631 minimal-edit file: remediate-deterministically;
  audit-editing; bench-real;
  decompose-edits.
- R633 edit-prediction file: predict-next;
  format-diffs; interleave-modes;
  scaffold-prompts.
- R635 in-practice file: capture-interactions;
  watch-usage; program-prompts;
  support-struggles.
- R637 boundary-crossing file: model-boundaries;
  relay-specialists; automate-verifiably;
  learn-meanings.
- R639 repair-equivalence file: repair-with-checkers;
  judge-behaviorally; check-robustness;
  separate-parameters.
- R641 feedback-refinement file: loop-automatically;
  ask-efficiently; verify-within;
  refine-not-resample.
- R643 adaptive-compute file: select-by-surprise;
  introspect-cheaply; change-within;
  evolve-demos.
- R645 partner-regulation file: share-percepts;
  align-jointly; regulate-sharedly;
  govern-runtime.
- R647 propensity-scheming file: measure-propensity;
  expose-faking; stress-factors;
  teach-admission.
- R649 trace-tampering file: distill-to-reveal;
  guard-traces; split-to-reveal;
  count-invisible.
- R651 provenance-watermark file: mark-the-process;
  layer-the-code; key-the-provenance;
  trace-robustly.
- R653 watermark-attack file: watch-marks;
  fingerprint-distillation; ask-back;
  disentangle-identity.
- R655 face-control file: restore-blindly;
  swap-controllably; model-parametrically;
  steer-aligned.
- R657 embodied-memory file: memorize-parametrically;
  gesture-fully; fuse-widely;
  embody-audio.
- R659 frozen-expertise file: learn-deployed;
  route-jointly; upcycle-frozen;
  graft-experts.
- R661 momentum-worlds file: carry-momentum;
  center-entities; guide-momentum;
  carry-together.
- R663 agentic-architecture file: mine-quality;
  work-the-architecture; distrust-consensus;
  loop-closed.
- R665 authority-reconciliation file: authorize-transitions;
  weight-speakers; reconcile-systems;
  validate-outputs.
- R667 hallucination-grounding file: perturb-decoding;
  decode-grounded; amplify-stepwise;
  ensemble-tokens.
- R669 gatekeeper-psychology file: keep-four-factors;
  guarantee-feasibility; learn-the-human;
  protect-the-embodied.
- R671 paradox-dynamics file: navigate-expertise;
  expect-inversion; resolve-finitely;
  govern-locally.
- R673 knowledge-elicitation file: elicit-tacit;
  sense-knowledge; seal-semantically;
  build-on-priors.
- R675 mixed-type-synthesis file: found-openly;
  cross-datasets; cascade-generation;
  co-evolve-arms.
- R677 counterfactual-assessment file: reexamine-treatments;
  rank-counterfactually; track-fast;
  assess-cause.
- R679 phantom-null file: audit-phantoms;
  partition-causes; guard-verifiers;
  evolve-verification.
- R681 majority-escape file: escape-majorities;
  reveal-reliably; illude-tools;
  verify-tools.
- R683 verification-cost file: verify-worlds;
  pay-the-tax; separate-review;
  layer-verification.
- R685 agreement-traps file: measure-coupling;
  trap-sets; estimate-noise;
  bias-codes.
- R687 divergence-sovereignty file: diverge-evidence;
  leak-memory; isolate-sovereignty;
  shatter-metrics.
- R689 validity-guarantees file: validate-first;
  curve-confidence; saturate-privately;
  conform-small.
- R691 verified-lexing file: lex-verified;
  invert-lexing; zip-lexing;
  paradox-compliance.
- R693 repo-localization file: trace-lines;
  gym-vulns; race-reasoning;
  rivet-context.
- R695 task-schedule file: learn-tasks;
  read-smoothly; bridge-reasoning;
  resolve-gaps.
- R697 shape-preserving file: preserve-shapes;
  native-graphs; disentangle-dual;
  print-fab.
- R699 constraint-generalization file: breed-constraints;
  prune-first; twin-semantically;
  soften-driving.
- R701 persona-fidelity file: personify-structurally;
  compress-onboard; tree-traffic;
  lexicon-nets.
- R703 assurance-contracts file: contract-omissions;
  assure-traces; eval-surely;
  provenance-agents.
- R705 edge-physical file: unify-runtimes;
  sense-sparse; twin-semantically;
  mine-edges.
- R707 responsibility-boundaries file: replay-multiversions;
  vacuum-responsibility; redraw-maps;
  bound-search.
- R709 epistemic-uncertainty file: marathon-reasoning;
  diffuse-epistemics; plane-tangentially;
  think-twice.
- R711 robustness-trilemma file: transfer-robustly;
  extend-trilemmas; obfuscate-nulls;
  encode-context.
- R713 shared-representations file: bound-sharing;
  successor-constrain; disentangle-dynamics;
  guard-geometry.
- R715 open-form-discovery file: probe-faintly;
  discover-openly; map-flows;
  infer-relationally.
- R717 co-optimization-crawl file: co-optimize-neurally;
  crawl-softly; tail-crawling;
  model-technologies.
- R719 mechanical-intelligence file: snake-passively;
  morph-passively; swim-cluttered;
  distill-elastically.
- R721 soft-actuation file: seal-haptics;
  inspire-softly; model-pneumatics;
  print-visually.
- R723 speed-accuracy file: convolve-fast;
  lightning-parallel; cheapen-queries;
  think-auto.
- R727 worth-it file: condition-updates;
  compare-RAGs; chunk-semantically;
  flux-data.
- R729 looped-efficient file: loop-self-improve;
  vector-smart; gate-entries;
  transfer-histo.
- R731 tripartite-authorized file: authorize-cross-interface;
  tripartite-compute; write-kathleen;
  steer-nous.
- R733 refine-link-scale-expand file: refine-data;
  link-values; scale-vocab;
  expand-trees.
- R735 frozen-verdicts file: job-learn;
  route-within; sift-self;
  overrule-cherry.
- R737 skill-transfer file: compile-skills;
  stabilize-evolution; demystify-skills;
  evolve-teams.
- R738 rehearsal file (DTR/odor-adjacent): dream-rehearse;
  curve-replays; adapt-memory;
  couple-past.
- R739 open-world file (DTR detect-new wing): unify-worlds;
  initiate-self; core-anomalies;
  test-hierarchically.
- R741 recursive file (RSI-proper context): rise-recursive;
  distill-self; bound-loops;
  evolve-grounded.
- R743 closed-loop file (C17-audit fuel): embody-astra;
  close-loops; find-closed;
  oversee-evidence.
- R745 shielding file (guard-feature round-3 fuel): shield-learning;
  ease-shields; guide-shields;
  robustify-shields.
- R747 anti-collapse file (probe-audit successor fuel): diversify-values;
  repel-members; collapse-uncertainty;
  repel-physics.
- R749 distillation file (round-4 candidate-A fuel): clone-endless;
  scale-traces; tree-policies;
  distill-datasets.
- R751 trunk file (DTR parts-i fuel): latent-skills;
  generate-behaviors; retrieve-relevant;
  compose-modules.
- R725 preconditioned-attention file: lucid-attention;
  shallow-cycle; dummy-prototypes;
  unsupervise-spotting.
- R433 addendum: RAEGL (default-global + separate selection-
  from-calibration) filed as THE successor vote design;
  surprise-alone-learns-lies filed on C16 as the epitaph;
  evidence-gated adoption (Guo) + modality-disentangling
  banked unlicensed. The bar stands.
- R431 addendum: Chen head-task action bias (tail falls back on
  head patterns when evidence is thin) filed as the wound's
  cross-domain twin lens (same shape, different substrate);
  memorize-to-compose + factor-holdout + de-blur banked unlicensed.
- R429 addendum: Montero limits adopted as method-caution on
  part-based claims (disentangled-don't-compose robustly;
  object-centric untested beyond scenes); Zahran anticipation
  filed as the forward direction (predict unseen combos);
  DRPT + frequency-rule banked unlicensed.
- R425 addendum: Kaplanis invariance-across-timescales adopted as
  the robustness criterion our transfer test approximates (train
  vs transfer = two timescales of one rule); MTR cascade +
  Memini coupled edges + LT-Gate + switching dynamics banked
  unlicensed.
- R423 addendum: Caccia encoder/decoder compatibility (old rows,
  new code) filed as version-awareness method (read old rows with
  the code that wrote them; scorer re-derives, never rewrites);
  MRDC density + bank-compression + CMM banked unlicensed
  (evidence stays raw — compression is for future stores, and
  only with a frozen codec + dual provenance).
- R419 addendum: NOTE (robust-vs-temporal-correlation) filed WITH
  Tomar's warning as the warning+fix method pair (read together);
  SITA single-instance extreme + neighbor-discovery + class-split
  banked unlicensed.
- R417 addendum: un-mixing shelf (Su separate-first + UnMix-TNS
  per-instance + MoETTA one-path-per-domain + Meta-TTT align-
  auxiliary); Tomar's temporal-correlation warning adopted as
  method-note (our rows are temporally correlated by construction);
  all unlicensed.
- R415 addendum: MASA self-referential trap (vote with the wound's
  own outputs) filed on C16 as the mechanism-mistake to avoid
  (external anchors or stark statistics only); UniTTA honest-wild
  benchmark adopted as method; Park both-shifts + TTVD Voronoi
  banked unlicensed.
- R413 addendum: Sakai route-codebook (scored trajectory-vs-codebook
  alignment) filed with DTR inference as the cleanest algorithmic
  statement of the transfer test; Yi saturation warning (benchmarks
  hide hard routing) adopted as method-caution; routed-CL paradigm +
  hyperbolic reliability-routing banked unlicensed.
- R411 addendum: transport-discrepancy joins max-discrepancy as the
  successor vote's statistic (both label-free, both per-step);
  behavioral rehearsal (hard-first) + BP-TTA (imbalance+shift) +
  DLEPEM (match-then-route, rehearsal-free) banked unlicensed.
- R409 addendum: Zhu staleness (fixed summaries rot under shift —
  prototype-version of the wound) argues ADAPTIVE cause
  representations; UDRM (replay-the-unsure) + open-world
  uncertainty (reliability + DP-GMM) + guided few-sample replay
  banked unlicensed.
- R407 addendum: localize-FIRST-then-forget (Rahimi-Kalahroudi:
  local forgetting for local change — the surgical ideal C16
  missed; LOCAL = HB-only wound shape); Yang caveat (deletion
  costly if dynamics return — recurrence) attached to the CAWM
  note; manifold replay banked unlicensed.
- R405 addendum: CAWM (CUSUM abrupt-only changepoint + forget-stale
  + keep-representation, DreamerV3 embodied) filed as the CLOSEST
  RUNNABLE C16-fixed loop; RIFAR (embodied reliability-informed) +
  FOREVER (Ebbinghaus scheduling) + IDER (do-no-harm replay)
  banked unlicensed.
- R401 addendum: DIRAD (complexify-past-conflicts) + CPLUS
  (self-probe-then-dampen, gentlest response) + SLICE
  (conflict-aware init) filed as the conflict-handling shelf;
  all unlicensed.
- R403 addendum: surgery shelf (PCGrad classic + domain-signal +
  EMA-care + reliability-aware conflict-≠-harm); V1o note: thirds
  were REAL HARM (G0 0.36 proves), not mere disagreement.
- R399 addendum: AFEC (active-forgetting of NEGATIVE transfer) filed
  as family #1's normative statement (erase the conflicting mapping,
  keep the rule; conflict-detection is the missing piece);
  TASER (atomic-skill expansion+routing for HETEROGENEOUS tasks)
  filed with DTR's distinct-tasks setting; ADEPT (decoupled
  general-vs-domain tuning) banked unlicensed.
- R397 addendum: Lee DPM (neural Dirichlet-process mixture, task-free
  infinite causes) filed as the nonparametric cause-inference;
  DRIFT (continuous-shift benchmark) + PST (single-net segments)
  banked unlicensed; Korte three-levels (data/partition/learner)
  adopted as method for describing banks vs learners.
- R367 addendum: SECOND CANDIDATE FAMILY (training-side) —
  multi-codebook training (train A + pseudo-codebooks synthesized
  from A per Enomoto/PMDG, transfer B; Gan valence-as-attribute,
  Lee canonical-projection, Wang domain-vs-content as unlicensed
  variants). Changes the train protocol — G2b baseline implications
  must be IN any freeze. Candidates, not lines.
