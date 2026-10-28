# RSI plan amendment v12: endogenous phase-indexed taste slots

## Why

Gen7 exhausted within-phase plasticity scheduling (single-step: washes out /
bank-flips to exact-zero fresh; windows: silent-or-saturate). The remaining
class is representational: the A-leg needs its own weights. Two taste slots,
each a full taste vector, indexed by an endogenous phase key — online
2-means over the slow cue-EMA (the learner's own cue statistics, no labels,
no phases, no observer quantities). Active slot predicts and learns live;
records are tagged with the active slot at acquisition; replay updates the
tagged slot, so B/C replays never touch the A-vector and return-A finds it
intact. Slot 0 initializes as the current single vector's twin; S=1 default
is bit-exact prior behavior.

## v12b signal pivot — SUPERSEDED by v12c (same round, before banking results)

The cue-keyed build flatlined (score 0.05 on v13): production records split
17/15 across slots with IDENTICAL centroids — local contact-cue statistics
carry no phase information (same food types, different placement), so both
slots chase one EMA and each learns a random half of one stream. Clean
negative about the signal, not just the dynamics. The richness pivot below
also failed (v12c text), for the same structural reason: signed intake mixes
beneficial (+) and harmful (−) encounters to ~0 mean in EVERY phase, so its
slow EMA converges to the same point regardless of nutrient density.

## v12c gap key (same round, before banking results)

The key is now the slow EMA (α=0.02) of the learner's own INTER-ARRIVAL
times (ticks between acquisitions) — an endogenous density signal: rich (A)
phases yield short gaps, scarce (C) phases long ones. Same idle-chase /
frozen-active dynamics, same dial ρ, renamed state (`gapEma`, scalar
`slotC`, `slotLastTick`). No S=2 bodies were banked (only failed search
outputs), so no restore-compat debt. A v12b→v12c methods bug was also
fixed in this pass: `tasteUpdate` read the routed slot for prediction but
wrote the update to `weights.taste` (regression test added pinning live →
active-slot and replay → tagged-slot writes).

* `phaseSlots` S ∈ {1,2} default 1; `slotRate` ρ > 0 default 0.05
  (centroid tracking; gap-EMA α=0.02 fixed internal). S=1: no new state,
  identical ops.
* S=2 state: top-level `slot=[v0,v1]`, `gapEma`, `slotC=[c0,c1]`,
  `activeSlot`, `slotLastTick`. `slotObserve` on acquisition (2nd+): gap =
  tick − last acquisition tick; slow gap-EMA drift, then the IDLE centroid
  chases the EMA at ρ while the ACTIVE centroid stays frozen; control
  switches only when the idle centroid is strictly nearer. Centroids are
  routing pointers — knowledge lives in the slot weights, which the frozen
  active slot protects. All billed.
* `tasteUpdate` routes live → active slot, replay → `record.slot`.
* Explicit boundaries (assert at create): no `streams>1 × slots>1`, no
  `consolidationRate>0 × slots>1` — untested combinations fail loudly.
* Menu on R=4 Gen1 base (no surprise/streams/consolidation): A (greedy)
  ρ ∈ {0.01,0.05}; B (random, matched) two of {0.005,0.02,0.1,0.2} drawn by
  mulberry32(20261106).
* Rules unchanged: new search bank v13, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. Claimant must beat the
  R=4 Gen1 baseline. All prior failures stand, including gen7.

## Gen8 fresh eval — REJECT (slots ρ=0.2, gap key)

Bank `0d9f05fa…`, 48 worlds, one frozen attempt. Gates v2: (1) vs unlearned
mean EXACTLY 0.0 element-wise (2.7419 vs 2.7419) 8/8 — FAIL; (2) vs
frozen-after-A +0.512 8/8 — PASS; (3) vs reset +1.80, all ≥−1.00 — PASS;
(4) skills aSkill 0.571 6/8, bSkill 0.858 7/8, bAcq 0.205 4/8 — PASS;
(5) aRetention +0.301 7/8 surv +7 PASS / bRetention +0.044 4/8 surv 0 PASS
(thin); (6) transferReset −0.00004 surv 0 — PASS tie; (7) integrity PASS.
Gate (1) fails → REJECT. Successive 0/2 (Gen7 REJECT, Gen8 REJECT).

Control (same gen8 bank, R=4-alone Gen1 config, 24 worlds): seq +4.4261 8/8
surv +77. The bank offers lifetime gains; the slot addition silenced them
(0.0). Mechanism silencing, not bank property. Reading: halving the
per-vector update rate (random 50/50 routing) keeps every prediction
below the greedy action threshold, so behavior collapses to prior —
all-or-nothing through the threshold nonlinearity, not a graded ~2.2.
The same signature as Gen7 (surprise-gain silenced R=4 to 0.0 on its bank).
