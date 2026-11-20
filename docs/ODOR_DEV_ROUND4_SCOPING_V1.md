# ODOR DEV ROUND 4 SCOPING V1 — hypothesis slate (NOT FROZEN)

Date: 2026-11-02. Zero worlds. Status: SCOPED (slate recorded,
ranked, unfrozen; no license, no bank, no code, no execution).
Rounds 1–3 closed: baseline fail / rehearsal (retention yes,
transfer no) / guard-feature (information dead). The lane needs a
genuinely new hypothesis. Three candidates, ranked by
leverage-per-evidence-cost.

## Joint facts constraining the slate

- Learned transfer ranking: R1 (+0.42) > R3 (−0.42) > R2 (−1.20).
  Nothing learned has beaten guarded on transfer (R1 0/8, R2 5/8
  on a +0.14 mean, R3 3/8).
- Guarded = nonlinear physics gate (turn/travel ticks, viability
  threshold). Learner = linear 2×D values over 8–10 features.
- A-retention ranking: R2-rehearsal (96%) > R3-guard (78%) >
  R1 (22%). Exposure preserves; information refines; neither
  transfers.
- Survivors thin in all rounds (2–9/history) — mortality is
  orthogonal (MORTALITY_MEASUREMENT_V1), not addressed here.

## Candidate A — guarded distillation (rank 1: cheapest, sharpest)

Train learned steering to MIMIC guarded rollouts (behavioral
cloning on the same 8 reused histories), then probe transfer.
Differs from R3 (which gave the learner guarded INPUTS but the
environmental reward): this changes the TRAINING SIGNAL, not the
inputs. Falsifier, pre-registered: if cloned-guarded still loses
to guarded on transfer, the gap is architecture (capacity), not
signal — promotes candidate B and closes signal-side explanations
for good. Dev-legal (reused histories, no new seeds).

## Candidate B — nonlinear steering head (rank 2: addresses the
falsifier of A directly, biggest instrument change)

Replace/augment the linear 2×D values with a threshold-gated head
(viability-gated branch structure mirroring `overlapGuard`:
compute-then-gate inside the learner). Direct attack on the
policy-expressiveness verdict of R3. Bigger build: new steering
module + fixtures + billing; needs its own design doc before any
freeze. Only licensed if A fails (sequencing, not parallelism —
one hypothesis per round).

## Candidate C — geometry randomization (rank 3: robustness, not
skill)

Train with randomized resource geometry (domain randomization on
`resourceCenters`/layouts) to close the training-ecology vs
transfer-ecology gap. Motivation: guarded is geometry-invariant
(physics); learned may overfit training layouts. Falsifier: if
randomized training doesn't move transfer, robustness isn't the
gap. Cheaper than B, weaker theory than A (no account of the
viability-use gap).

## Sequencing (frozen at plan time, not here)

R4 = candidate A ONLY (cheapest test of the signal-vs-architecture
question). B stays queued behind A's falsifier. C is the fallback
if both A and B close. No parallel arms across hypotheses —
single-variable discipline holds since round 2.

## R749 addendum (distillation file — 4 outside legs for candidate
A, filed unlicensed)

- Never-ending BC (Liang): multi-modal observations; series of new
  tasks is the setting, 3D + human-level the blockers. Round-4
  analogue: guarded rollouts on the same 8 histories are the
  multi-modal teacher.
- Scalable BC (Yang): bottleneck is deciding under incomplete
  information; priors live implicit in traces. Round-4 analogue:
  the learner's deficit may be exactly these priors.
- Neural-to-tree (Li): black-box to verifiable if-then; stationary
  assumption violated. Caution for round 4: the teacher (guarded)
  is stationary-policy; the student faces non-stationary phases —
  distill per-phase or expect the violation to bite.
- Dataset distillation (Light): synthesize a better dataset when
  quality is unavailable. Fallback if guarded rollouts underperform
  as teachers: distill the dataset, not the policy.

## Open items before a frozen dev plan

1. Distillation protocol (whose rollouts: guarded on the same 8
   histories, how many ticks, supervised loss + billing).
2. Instrument change list (BC loss path, teacher forcing hooks).
3. Arms/probes (learned-distilled + full suite; comparators reused).
4. Caps (R3 actuals × margin).
5. Verdict mapping (transfer gate + retentions + beat-guarded bar,
   same as R3 — the bar doesn't move, the treatment does).

## Parallel track (not this line)

DTR parts (i)–(iii) shared-trunk/head substrate builds remain the
deeper M2 path (TAME/PAH references filed); this slate is the
odor-lane (iv) path. The two meet at qual design (iv-b), not before.
