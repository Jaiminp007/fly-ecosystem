# DISTINCT-TASKS RETENTION (DTR) SCOPING V1 — BLOCKED-substrate

Date: 2026-11-02. Status: DESIGN ONLY (no license, no bank, no code).
Motivation: VISION names it open ("continual retention across distinct
tasks remains open") despite M2 MET within-task; R311 fuel (Lin
backward transfer; Yang world-model replay; Ganguli replay-free).

## What DTR would test (sketch, not frozen)

Sequential A→B with the SAME agents, then re-test A (backward) and
test B (forward): does learning B preserve-or-improve A while
acquiring B? Arms (sketch): sequential vs single-task-A vs
single-task-B vs reset. Gates (sketch): A-retention (re-test A ≥
train A − tol) AND B-acquisition (B ≥ unlearned + bar), conjunctive.
Distinct tasks in-substrate: taste turn-gating vs odor-routed
foraging vs mating/encounter. Scenario (R327/van de Ven): task-IL
FIRST (identities known, sequential A→B) — the sketch above.
Domain-IL / class-IL (identity inferred) only after task-IL works.

## Central blocker: no shared representation across tasks

1. Controllers are task-specific (taste 96-dim chemotaxis weights;
   odor/mating dims differ). Transplant machinery REQUIRES weight-
   shape identity (checkTransplantIntegrity) — cross-task transplant
   is currently ill-defined, not just untested. Now field-consensus:
   R321 (Liu) — multi-task RL adaptation LEVERS shared
   representations; without them there is nothing to adapt with.
   Blocker #1 is the field's premise, not our idiosyncrasy.
2. Weights ARE niche models (1-NN 1.000) — the very property that
   makes them transferable within-task makes them non-portable
   across tasks. Retention across distinct tasks needs a shared
   trunk (doesn't exist) or task-indexed heads (don't exist).
3. No backward-transfer scorer exists (all scorers are forward:
   train→transfer). The T1/T2 chain machinery measures forward legs
   only.
4. The odor task itself is exploratory (ODOR_ROUTED dev only, never
   qualified) — DTR would need TWO qualified tasks first.

## Verdict: BLOCKED-substrate (specified parts list, no freeze)

DTR is not freezable now. Parts, in order: (i) shared-trunk (or
head-indexed) instrument + fixtures; (ii) cross-task transplant
definition + integrity; (iii) backward scorer (re-test-A
machinery); (iv) second qualified task; (v) then a DTR frozen plan
+ fresh bank. Each part is its own line. This scoping converts the
open sentence into a work list — advancement, not closure.

## R327 implications recorded (unlicensed)

- Part (i) precedent: TAME (task-agnostic experts + shift detection) —
  trunk + task-indexed experts with routing triggered by detected shift.
  The design to beat/adapt at freeze time.
- Inference-head OPTION (Hafez ×2): self-supervised task inference
  (action/intention embeddings, no predefined representations) beside the
  labeled task-IL route. Two routes specified; both need building — the
  option does NOT unblock (blockers stand), it de-risks the freeze.
- R329 addendum: THREE votes now favor infer-not-given (TAME shift-
  detection + Hafez self-organization + Lei librarian routing without
  task-ID). Freeze should LEAD with the inference-head, labeled route
  as fallback (reversal of the original sketch's assumption).
- R335 addendum (hypernetworks — the trunk literature, all feed part
  (i), none unblocks): von Oswald canonical task-conditioned generation
  (+ weight-realization rehearsal) joins TAME as the second reference
  design; Partial sizing principle (freeze early/generate late — shared
  chemotaxis trunk + small task heads, don't generate everything);
  HyperMask merges the SU thread (trunk-GENERATED masks — our per-tick
  mask could one day be per-task generated, conditional on the trunk);
- R350 addendum: DaCoRL (incremental context-clustering + expandable
  multihead policy for continual RL) joins TAME/HyperMask as the third
  part-(i) reference — clustering + expansion in one system (routing
  and growth together).
- R353 addendum: PAH (single hypernetwork + learnable task prototypes +
  dual distillation, logits + prototypes) takes the LEAD as the reference
  design (most complete: index + generation + stabilization in one);
  CPP steering (contrastive prompt-tuning against drift/interference,
  rehearsal-free) is the drift-handling to steal at design time.
- R365 addendum: detect-new/infer-latent shelf extends the
  infer-not-given wing — Mundt (replay+open-set unified), Perez
  (latent world-properties via online Bayes, closest spirit to
  codebook-shift), Bendale (original open-world detect+add+update
  loop), Xu (OpenIncrement detect-then-learn). All unlicensed;
  the wing now leads inference-head design with 7 references.
- R366 addendum: LCNet (shared-in-weights + context-in-module) is
  the trunk/head theory ANCHOR (strongest on record); Song
  (extinction = new-cause inference) is the wound's computational
  theory; ConFER (renewal modeled — our flip-split is a renewal
  test already); HOLMES (nested online). Theory shelf complete;
  substrate still the blocker.
- R375 addendum: SANE (task-agnostic SELF-ACTIVATING modules —
  infer-not-given + modularity combined) joins the wing as the 8th
  reference; SEERL (diverse ensemble from one run) is the
  constraint-compatible diversity note; Garcia (online-weighted)
  is performance-arbitration precedent. All unlicensed.
- R377 addendum: ROUTING IMPLEMENTATION shelf — CaLLM (prototype
  routing, PAH's index at run-time) + Latent-LoRA (gradient-free
  routing, most constraint-compatible; gate-recursion named) lead;
  Dobrzeniecka (retrieval routing + eval) + CARL-CXR (task-unknown,
  our setting exactly) support. Route-by-input is now specified
  three ways (prototype, gradient-free, adapter); all unlicensed.
- R379 addendum: COMPOSITION shelf — MoCL-P (compose+prune,
  budgeted), L2R (isolate-train + learn-to-compose), Mendez
  (lifelong compositional RL), modulating-masks (fixed backbone).
  L2R's failure modes map: training-interference SEEN (V1o),
  routing-suboptimality UNTESTED (routing shelf's open question).
  All unlicensed.
- R381 addendum: AMSC (similarity-gated policy combination from
  ONLINE experience — closest transfer-operator on record) joins
  the wing; cross-agent mask sharing (population-adjacent) +
  PEMN (task-in-mask) noted. All unlicensed.
- R739 addendum: OPEN-WORLD shelf (detect-new/infer-latent wing now
  11 references) — Kim (OOD+CIL unified: recognize-learned +
  detect-never-seen + learn-incrementally); Bing Liu (self-initiated:
  self-motivated, detect/characterize/accommodate without engineer
  retraining); CADIC (class-sub-banks restrict; incremental coreset
  for new-task normals); H2ST (closed-world assumed by TIL;
  hierarchical two-sample tests for unknown identities). All
  unlicensed; the wing leads inference-head design.
- R751 addendum: TRUNK shelf +4 (all unlicensed) — LatentSkill
  (hypernetwork → plug-and-play LoRA adapters; weight-space not
  context-space; modular loading/scaling/composition — the most
  constraint-compatible generation pattern on record); zero-shot
  hypernets (TD-trained generation across unseen task conditions
  from near-optimal solutions + task params); task-adaptive
  retrieval (hippocampus-like relevant-past retrieval for new
  tasks — guides decisions without environmental interactions);
  task-driven modular (compose learned modules into novel concepts
  zero-shot — the compositional-efficiency bar). The part-(i)
  design space now Shelves trunk-generation + retrieval +
  composition together.
- R427 addendum: WHAT/HOW two-system (infer-computation + implement-
  it) filed as the reference implementation shape for trunk/head
  + inference; GaTaP two-loop gating + part-conflict + CompIL
  banked unlicensed.
  dependency-preservation is a CONSTRAINT (niche-model weights are
  structured — generation must respect it, not emit flat vectors).
- R329 addendum: the isolate-vs-share tradeoff (CP-MoE) is the part-(i)
  design constraint (isolate experts = no transfer; share updates =
  forgetting); CP-MoE's transient expert is the middle path to steal at
  design time. MoE gating theory (Li: gating sparsifies/distributes
  tasks) is the when/why guidance for the same design.
- Embodied note: Hafez is robot control — inference emerging from
  behavior connects to Track-K1 scale, if DTR ever reaches an embodied
  task pair.

## R311 implications recorded (unlicensed)

- Backward (Lin) is the missing DIRECTION, but direction alone
  doesn't unblock (blockers 1–4 stand regardless of direction).
- Replay-free retention (Ganguli) suggests the eventual answer may
  be architectural (trunk/heads), not replay-scheduling —
  consistent with blockers 1–2 being substrate, not schedule.
- World-model replay (Yang) stays a channel without a substrate.

## R323 implications recorded (unlicensed)

- Trunk design principles (part i): modularity-by-locality (Velez:
  diffusion neuromodulation eliminates forgetting in simple nets)
  joins input-conditioning (TFGN) — two outside-box principles.
- The trunk owes representation AND modulation (Ben-Iwhiwhu:
  context modulates a standard policy net); shape alone won't do.
- NeuMoSync's joint framing adopted as diagnostic lens (saturation
  and wound may share a cause; the trunk fixes or explains both).
