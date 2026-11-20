# RSI INTERNAL-LOOP SCOPING V1 (Track C opening move; DESIGN, not frozen)

Date: 2026-11-02. Pre-freeze scoping for completion-plan Track C
(C1: design the agent-internal propose-evaluate-adopt loop). Zero
worlds, no code, nothing frozen. Outside-the-box options assessed
against the record, honestly including the thin headroom.

## The definitional bar (completion plan, verbatim in spirit)

The AGENT's controller generates, sandboxes, and evaluates revisions
to its OWN learning system (checkpointed, budgeted). External search
(R-GATE/V2–V35/offline selector) is the BASELINE the loop must beat,
not the thing itself. Population selection over variants FAILS the
definition (evaluation by selection is external, not self-evaluation)
— ruled out, with reason.

## Headroom audit (what could a loop possibly win?)

- Turn-gating: SATURATED. Train 0.915 structural (time +0.0000);
  HB 0.95 near-ceiling; BH 0.85 live-dominated (replay adds ~0).
  A loop here would demonstrate machinery, not product.
- Operators (replay-gating/shrinkage): one deployed win each, both
  near their ceilings (HB 0.95; dose plateau). Thin.
- Mating: ENORMOUS headroom (encounters 0.05–0.15/main; most agents
  never mate; births gated by bar/timing/topology). But multi-agent
  (pairwise success; credit assignment across agents) and sandboxing
  needs counterfactuals (unbuilt world-model).
- Conclusion: nowhere offers easy product. The loop's first win must
  be CAPABILITY (it runs correctly: bounded, checkpointed,
  self-assessed — the M3 capability/product split applied inward),
  with product gated by the original RSI bars (≥2 successive accepts
  + productivity vs copied-improvement; bars do not move).

## Candidates, feasibility-ordered

- **B-first (recommended): operator loop on turn-gating.** Controller
  proposes own operator tweaks (replay gains, shrinkage α, update
  rates) from a menu; sandboxes by replaying retained own experience
  (the migration-study machinery: retained factual experiences);
  adopts iff sandboxed improvement ≥ bar, then live-validates on
  fresh tasks. Cheapest build (reuses kernel-learner + replay +
  migration code paths); loop-integrity verifiable (boundedness,
  checkpointing, self-assessment honesty) even if product is null
  (expected-null on saturated substrate — an honest C1 outcome).
- **A-second (headroom play): mating-success loop.** Same machinery,
  individual policy tweaks (thresholds, leaving, pause), assessed on
  mating success. Only if B's loop is mechanically sound (A inherits
  B's loop + a harder credit problem). Multi-agent assessment needs
  its own frozen design (whose success? pairwise attribution?).
- **D-parked (hardest): sandbox-simulation loop.** Agent-carried
  world-model for counterfactual evaluation. Requires a feasibility
  probe first (stochastic seeded ecology may be unlearnable compactly;
  sim-to-real gap = transfer tax writ small). Not before B runs.

## What freezing C1 requires (not done here)

A frozen C1 plan needs: the loop's exact proposal language (menu),
sandbox semantics (which retained experiences, how replayed),
adoption bar (sandboxed ≥ x, live-validated on fresh bank),
budgeting (whose ops? the agent's lifetime budget), and the
loop-integrity fixtures (boundedness, checkpoint-restore,
honest self-assessment vs sandbagging). Plus the M3-style claim
gates restated for internal proposals. None of that is specified
above — this doc is the scoping that says B-first is the bet.

## Status

SCOPING (zero worlds). Next: freeze C1 (B-loop) under its own plan,
or park Track C if the program judges the capability/product gap
unbridgeable on current substrates. No RSI claimed (loop unbuilt).
