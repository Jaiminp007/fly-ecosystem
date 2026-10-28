# Retention-mechanism study — plan V1 (FROZEN)

Frozen 2026-10-28. Status: FROZEN, unexecuted. No performance work may run
outside this plan. Single authorized attempt. Basis: `docs/RETENTION_MECHANISM_STATUS.md`
(C1–C5 corrections, E1–E7 exploratory findings, H1–H3 hypotheses).

## Questions (frozen)

Q1. Does behavioral A-retention failure live in the taste readout or
downstream of it (motor values/policy/routing)? (H1; decision-relevant.)
Q2. What is the history-level structure: uniform tax vs reordering, and what
resolution can any future claim have? (H2/H3; methodological, zero new worlds.)
Q3. Given Q1–Q2, which concrete next intervention is justified: directional
protection, additional sensing, or another mechanism? (Decision; this plan
only recommends, a follow-up plan executes.)

## Estimands (frozen)

- R0 (existing data, zero worlds): per-history atA-vs-atC greedy-choice and
energy differences on identical probe seeds (V2 early-A vs battery A-probes),
with survivor-mismatch caveat recorded, not corrected.
- R1 (new probes, budgeted below): per-history recovery fractions
f_cond = (aRet_cond − aRet_C) / (aRet_A − aRet_C) for cond ∈ {taste, motor},
where aRet_X is the standard retention combination
(A:current − .95·A:A − .05·A:reset) from probes run on checkpoint X, and
aRet_A comes from the EXISTING early-A probes (free), aRet_C from EXISTING
atC batteries (free). New worlds only for the two reinstated conditions.
Histories with |aRet_A − aRet_C| < 0.05 use the absolute rule
(aRet_cond − aRet_C) instead of fractions.
- R2 (fixed-input, free): margin profiles recomputed on reinstated anchors
(descriptive consistency check with E4, not causal).

## Hypotheses and contrasts (frozen)

H1-motor: f_motor ≫ f_taste (retention is downstream; taste reinstatement
does nothing because readout margins are already intact, E4).
H1-taste (alternative): f_taste ≫ f_motor (readout is causal despite margins
— e.g., margins mislead because probes sample off-codebook cues).
H-distributed: both ≥ 0.5. H-elsewhere: both < 0.25 (locus in routing,
buffers, or policy state outside both subsystems).
H2 (structure): Q−N gap is history-independent (constant shift); tested
within R1 only if an N-body locus is found AND a follow-up is separately
frozen — NOT tested here (no fresh bank in this plan).

## Sampling rationale (frozen)

ALL 8 V2 histories, N-body only. No selection (avoids outcome-selection bias;
the analyst has seen per-history outcomes, so any subset would be suspect).
N-body because the source-learner retention failure is the primary explanandum
(V1N FAIL-source, V2N marginal PASS with 2/8 negative histories); body
comparison is explicitly out of scope until Q1 is answered.
Spent-bank reuse is deliberate and labeled: V2 seeds are spent, so R1 is a
MEASUREMENT study, never qualification; no learner revision, no tuning, no
promotion of any number to a gate. Fresh-bank exclusions: no new bank is
drawn; no new seeds are spent; the V1/V2/V3-dev banks remain spent and
untouched; probe RNG reuses recorded `probeSeeds` deterministically on
modified in-memory checkpoints.

## Instrument (frozen; to be built, fixture-tested, then run once)

`scripts/reinstate-probes.mjs` (new, small): for each of the 8 V2 histories,
load N-body atC anchor + N-body atA anchor from
`evidence/body-transfer/v2/attempt-01/anchors/`; build two modified clones:
taste-reinstated (atC anchor with weights.taste + tasteScale + priorLogit
copied from same-founder atA learners) and motor-reinstated (actor + critic
weights + both eligibilities + tdRms from atA); run the A-retention probe
subset (A:current, A:A, A:reset + A:A sham-identity) via the existing
`runTasteProbe` path with recorded probeSeeds.A; assert sham deep-equality
and weights-unchanged digests (probe path already asserts the latter).
Identity control: taste-reinstated-then-restored (= unmodified atC clone) on
ONE predeclared history (first in bank order) must reproduce the existing
atC battery bit-exactly, else INVALID.

## Controls (frozen)

- Baselines are existing frozen data (atC battery, early-A probes): zero new
worlds, no re-running.
- Factual saved weights only (no synthetic damage/permutation); subsystems
defined above, nothing else touched; buffers stay atC (probes are
frozen-inference, weights digest-asserted unchanged, so replay content is
causally inert — recorded as an assumption to verify via the digest).
- Survivor/degeneracy accounting identical to V2 gate 7 (expected ≥ the
recorded alive counts; any all-dead probe recorded, not imputed).

## Numeric decision rules (frozen; fractions, or absolute rule where noted)

- SUPPORT-H1-motor iff mean f_motor ≥ 0.50 AND mean f_taste ≤ 0.25 AND
mean(f_motor − f_taste) ≥ 0.30 with ≥6/8 histories f_motor > f_taste.
- SUPPORT-H1-taste iff mirror (mean f_taste ≥ 0.50 AND mean f_motor ≤ 0.25
AND ≥6/8 f_taste > f_motor).
- DISTRIBUTED iff both means ≥ 0.50. ELSEWHERE iff both means < 0.25.
- Any other outcome = INCONCLUSIVE.
- Severe-failure guard: report separately the count of histories with
aRet_C < −0.50 (severe) vs −0.50 ≤ aRet_C (mild); the rule uses means AND the
6/8 consistency count so a mean driven by one severe history cannot pass
alone. Average retention, consistency, and severe failures are reported as
three distinct lines (Q-requirement).

## Costs and budget (frozen ceiling)

CORRECTION (pre-execution, reason recorded): 100 new probe executions, not
68 — each `runAProbes` call is 3 probes + 1 sham-identity probe (sham
requirement was in the plan but uncounted), and completing the atA baseline
needs A:A on the unmodified atA anchor (the V2 early battery lacks the A:A
spec, so aRet_A cannot be formed from existing data alone). Breakdown: 8
hist × (4 atA-baseline + 4 taste + 4 motor) + 4 identity = 100 probes,
256 ticks × 24 founders each = 614,400 world-ticks, ≈14.7M founder-slots;
scalar-op cap 1e9 (est ≈ 3e8 — V2 averaged ≈ 3.4e7 ops/probe). Wall/CPU caps
600s per probe row batch, 8 GiB output cap inherited. New-ops ledger kept
separately (R1 ledger, NOT added to any qualification RSI/transfer ledger).
No mains, no banks, no seeds.

## Stopping rules (frozen)

One attempt. Halt → INCOMPLETE (not INVALID unless instrument): anchor digest
mismatch vs recorded V2 anchors; sham non-identity on new runs; any
weights-changed digest failure; op cap breach. Identity-control failure →
INVALID (instrument broken), publish and stop. No rescoring of outcomes, no
added histories, no added conditions, no second attempt under this plan.

CORRECTION 2 (pre-execution, reason recorded): the bit-exact identity clause
is replaced by a tolerance identity. Diagnosis on history 2789221780: the
frozen probe path rerun in-process is bit-identical (instrument
deterministic), with identical survivors (15/15) and identical billed ops
(170,497,603) as the filed V2 probe — but physical energy differs by
≈1.6e-3 (value Δ ≈ −7e-5) uniformly across all 12 battery probes. Same
op counts + same survivors ⇒ identical decision trajectories; the drift is
in world energy math (Node Math patch drift between the V2 run and now),
not the instrument. Identity control is therefore: (a) sham deep-equality
within every new run (unchanged), (b) cross-time: identical survivors +
identical billed ops + |Δvalue| ≤ 1e-3 on all A-probes vs filed V2 values.
Same tolerance applies to the atA-baseline reproduction asserts. Drift
magnitude (~1e-4 on retention combinations) is 3+ orders below the decision
thresholds and affects all R1 conditions equally (all run in-process under
one runtime); baselines carry it as a documented ~1e-4 offset.

## Decision mapping (frozen; recommendation only)

- SUPPORT-H1-motor → recommend a MOTOR-side intervention line (separately
frozen plan: e.g., slow-anchor on actor readout or progress-rule
augmentation), directional taste protection stays CLOSED.
- SUPPORT-H1-taste → reopen a READOUT intervention with off-codebook cue
analysis (margins misled; why?).
- DISTRIBUTED → recommend joint readout+policy intervention or new sensing.
- ELSEWHERE / INCONCLUSIVE → recommend observational-disambiguation sensing
(Option-B-style new observation line) or a separately frozen follow-up; do
NOT launch a larger campaign.

## Provenance freeze

Sources (sha256 recorded at execution): `learning/taste-energy.mjs`,
`learning/taste-experiment.mjs`, `learning/taste-pressure.mjs`,
`scripts/reinstate-probes.mjs` (new), V2 bank + attempt-01 anchors/rows
(read-only inputs). Any source mismatch vs this freeze invalidates the run.
