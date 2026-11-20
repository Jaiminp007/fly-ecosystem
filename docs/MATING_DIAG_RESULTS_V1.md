# MATING-FAILURE diagnostic results — STRUCTURAL (channel 3 unreachable)

Frozen plan: `docs/MATING_DIAG_PLAN_V1.md`. Read-only execution: engine
trace + 7 frozen endpoints. Zero new worlds, zero file modifications.

## Q0 (decisive): can BT actuation emit action-channel 3? NO — provably never

Chain (all frozen code, quoted):
- Engine reproduction loop (`engine.mjs`): mates only if
  `actions.get(f.id)[3] > 0` AND the mirror condition for the male.
- `World.step`: `actions.set(f.id, outputs)` where outputs come from the
  native controller, then the experiment's `afterController` splices the
  learner's 5-vector over indices 0–4
  (`taste-experiment.mjs:123`: `native.splice(0,5,...outputs)`).
- Learner vector: `outputs=tickMotor(state,raw,action)` → `motorPrimitive`
  (`cue-foraging.mjs:52-56`): returns
  `[turn, slow?-0.7:0, action>0?1:-1, -1, 0]` — **index 3 hardcoded −1**;
  `tickMotor` touches only index 1. Every tick, every agent, every arm:
  channel 3 = −1. The mating condition needs > 0.

No BT run — M-POP, feasibility, or any other — could ever produce a birth,
at any energy, any proximity, any age. The INFEASIBLE-BEHAVIORAL label
misattributed the mechanism: the flies cannot mate, not merely do not.

## Q1 (endpoints): opportunity existed and was wasted

M-POP: survivors 17/10/3 of 24; candidate level −56.1 (healthy, BT-normal).
Feasibility: maxE 66.8–71.5 ≥ 65 on ALL 4 mains; survivors 6–13. Energy bar
cleared repeatedly with co-alive populations. Proximity unassessable (rows
lack positions — recorded hard limit). The structural block bit into real
opportunity: had the channel existed, 7 mains had candidate conditions.

## Q2 (fix directions; design sketch only, no implementation)

- **Option A (minimal, overloaded):** `tickMotor` maps action 3 →
  `outputs[3]=1`. One-line engine change; but action 3 currently means
  pause-turn, so mating intent overloads an existing behavior with energy
  consequences (24 per mating) — confounds every future behavioral readout.
- **Option B (Avida-style, decoupled):** drop the action-channel clause in
  the engine loop; mating on proximity + energy + age + cooldown only.
  Reproduction becomes the default on surplus (copy with existing
  inheritance/mutation machinery), agency deferred. Matches 30 years of
  ALife precedent; removes the deliberate-act requirement the literature
  (Taylor #1, embodied-evolution review) says should be DESIGNED later,
  not assumed now.
- Choosing, implementing, or testing either option is EXCLUDED here; that
  is a new actuation line's design work under its own frozen plan.

## Verdict: STRUCTURAL

Channel 3 unreachable under all program actuation (all motorPrimitive-based
paths hardcode −1). Fix direction is actuation plumbing, per the frozen
plan. Licenses PROPOSING an actuation line (fresh plan + fresh bank +
fresh goal) — nothing is started here. M-POP and feasibility conclusions
stand (their runs were valid; their mechanism attribution is corrected by
this diagnostic). Outside literature (Avida, Taylor OEE, embodied
evolution) concurs: reproduction must be designed, never assumed.

## Cumulative: 7491 + 0 = 7491 (zero new worlds; read-only by construction)
