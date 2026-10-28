# Option A — New body transfer: frozen study plan v1

Frozen 2026-10-28. Status: DESIGN ONLY; no bank generated, no worlds run,
no qualification or RSI claim. One target, one prospective bank, one attempt.

## Question and standing

**Can the unchanged Gen1 R=4 taste-ecology learner retain its qualified
lifetime-learning and A/B skills with a turn-before-translate pursuit actuator,
including transfer of frozen acquired weights from the native actuator?**

This serves [Vision milestone 4](VISION.md): richer bodies and environments
only after the simpler models can be measured and explained. The eventual
goal remains artificial life that learns from experience, improves its own
learning, and supports richer cognition and, later, controlled population and
social studies. This study tests one movement interface, not that whole goal.

The entry evidence is the [v2 qualification](TASTE_FRESH_QUALIFICATION_PLAN_V2.md),
the 14-bank same-base robustness series, and the
[terminal negative synthesis](RSI_TASTE_NEGATIVE_SYNTHESIS_V2.md). The latter
closes bounded RSI at 5,128 conventionally counted worlds: 29 idea classes,
eight first accepts, no two successive accepts with two directed-search wins.
Milestone 3 was investigated; bounded RSI was not achieved. Milestone 4's
measurement/explanation prerequisite is not a claim that milestone 3 passed.

The synthesis's operative lesson is fixed-budget rehearsal reallocation and
bank-sensitive retention detail. No replay, memory, learning-rate or search
revision is permitted here. Lifetime gain cannot compensate for one failed
retention leg. The seven gates below retain the v2 numeric bars and add a
frozen-weight body-transfer requirement. These are prospective qualification
rules, not a powered estimate of a population-wide success rate or a claim
that eight histories resolve every effect near 0.1.

## Code survey and selected vehicle

Survey basis: working-tree source code, handoff file manifests and packaging
code. No archived trajectories, results arrays or multi-GB payloads were
opened. Handoff manifests locate historical sources; this is not an assertion
that current source bytes equal every archived revision. The requested
`pursuit-social-20251025` directory is absent; the available package is
`handoff/pursuit-social-20261025`.

| Prototype/package | Relevant code and actual capability | Option A decision |
|---|---|---|
| `pursuit-authority-20261024` | `learning/pursuit-authority.mjs:pursuitMotor` converts existing food bearing into bounded turns and pauses translation until aligned; has explicit operation counts. Its historical executor uses an oracle warmup and a different decision cadence. | **Selected motor primitive only.** Small, stateless actuator substitution with no new observations. Do not import the oracle warmup, eight-tick action hold, or old authority results as evidence. |
| `pursuit-social-20261025` | `learning/pursuit-census.mjs` observes target episodes, motion and intake; `learning/social-yield.mjs` predicts future intake from food/action and social features with blind/delayed controls. | Useful observer methods; not a new body. Adding the social predictor changes the learner/information interface. |
| `spatial-diagnostics-20261026` | `learning/overlap-harvest.mjs` exposes local patch points and steers toward pair midpoints; `guarded-overlap.mjs` adds wall/energy guards; `feeding-context.mjs` changes predictor features. | Rich spatial observations plus a new controller confound body and sense. Reserve for a separately frozen study; not this vehicle. |
| `odor-identity-20261024` | `learning/odor-identity.mjs` makes a 16-dimensional orthogonal code from four observed odor signs. | Representation of already observed information; no new body or independent information source. The chosen learner already has orthogonal taste. |
| `escape-commitment-20261025` | `learning/stall-transfer.mjs` and `scripts/escape-commitment.mjs` implement remembered half-turn escape and speed/steering witnesses. | Adds a timed controller with intervention-selection rules. Less clean than the stateless pursuit primitive; no parameter or duration sweep here. |
| `tick-development-20261025` | `learning/tick-actor-critic.mjs`, `tick-cue-experiment.mjs`, `tick-development.mjs`: four-action, 161-parameter actor-critic and continuing-world controls. | Different learner; reuse experimental discipline, not this controller. |
| `tick-policy-diagnosis-20261025` | `learning/tick-policy-diagnosis.mjs`: fixed-context weight/cue substitutions and policy readback. | Observer-only diagnosis; not an embodied performance intervention. |
| `tick-pressure-20261025` | `learning/tick-cue-pressure.mjs`: saved-weight reinstatement, common starts and copy sham. | Precedent for retention measurement, already adapted by `taste-pressure.mjs`; not a new body. |
| `tick-study-preflight-20261025` | `scripts/tick-development.mjs`: protocol validation, source capture, seed exclusions, collection/audit budgets. | Reuse provenance principles; its thirteen-arm study and confirmation reserve are not imported. |
| `tick-value-core-20261025` | `learning/tick-value.mjs`: 71-dimensional expected-SARSA features, prior-transition inputs, 64/16 memory. | Changes learning and memory; violates the copy constraint. |

The selected intervention is an **effective movement-body change**, specifically
an engineered actuator, not a claim of new anatomical morphology. Let N denote
the native `tickMotor` body and P the pursuit body. World geometry, food,
resource phases, sensing, noise and energy laws remain those of `TasteExperiment`.

For P, every decision retains the four existing action meanings:
0 accept/cruise, 1 refuse/cruise, 2 accept/stationary, 3 refuse/stationary.
Set `s=+1` for actions 0/2, otherwise `s=-1`. Obtain
`pursuitMotor(raw,s).outputs`; for actions 2/3 only, set movement output to -1.
For actions 0/1 **do not overwrite the primitive's movement output** with the
stock harness's `cruiseSpeed` override. Charge its returned 9 or 16 operations
plus two adapter predicates per decision. There is no call to `tickMotor` in
the P path and no double billing of that unused primitive.

Precisely, for nonzero `raw[0]^2+raw[1]^2+raw[2]^2`, bearing is
`atan2(s*(raw[2]-raw[1]),s*raw[0])`, with -pi canonicalized to +pi;
turn is `clamp(bearing/.28,-1,1)`; movement is -1 when
`abs(bearing)>.28`, otherwise 0. With zero magnitude, use the prototype's
`tanh(1.8*(raw[10]-raw[11]))` turn and movement 0. Feeding output is s.
The last two outputs remain -1 and 0. Stationary actions keep the primitive's
turn but force zero translation. No wall guard, speed tuning or persistent
actuator memory is added. N keeps the existing native mapping and half-speed
cruise (`cruiseSpeed=0`). Engine turn noise and collision handling are unchanged.

### Why this supplies a new test of information

The intervention changes the transition from the same observable state and
chosen action to the next physical observation: an off-axis cruise command can
now turn in place before advancing. It changes future contact, proximity,
signed intake and the learner's own action consequences. Those are fresh
embodied experiences, not different samples from a fixed old replay buffer.
There are **no additional sensory bits** in Option A; the novelty is the
action-to-observation relation. Option B would test additional sensing.

The causal hypothesis is that the existing taste and progress representations
remain useful under this different relation. The competing hypothesis is that
the learned skills or update rule depend on the native movement primitive.
In particular, P can convert a requested cruise into no translation, while
`progressUpdate` still sees the same chosen action and next proximity. This
mismatch is a substantive risk to test, not permission to rewrite its credit.
An actuator-only benefit is controlled by giving P to its unlearned, frozen,
reset and fixed-action arms too. More contacts may produce more naturally
earned examples, but capacity and four replays per admitted taste example
remain fixed and all actual work is paid. Do not claim extra information,
better learning efficiency or independent motor-skill transfer merely because
P's fixed cruising control improves.

## Frozen learner, worlds and arms

The term Gen1 here means the synthesis's static **R=4 base**, not the rejected
early `td` claimant named in `RSI_TASTE_GEN1_EVAL.md`. Instantiate this exact
configuration in both N and P:

```text
feedingRule=greedy       tasteRepresentation=orthogonal   tasteRate=1
motorRepresentation=ecology (96 motor, 16 taste dimensions)
holdTicks=1             motorRule=progress               renewalRate=0.1
capacity=32             recent=8                        replayPasses=4
replayStrata=1          replayRate=1                    replayTournament=1
greedyInference=true    criticWarmStart=false
tasteLearning=true      normalizeMotor=true             cueBlind=false
consolidationRate=0     motorConsolidationRate=0
streams=1               streamHysteresis=0
surpriseGain=0          surpriseWindow=0
phaseSlots=1            slotRate=0.05
marginWidth=0           marginBoost=0
replaySkip=0            replaySurpriseGain=0             evictBias=0
cruiseSpeed=0 (N; P uses the movement mapping specified above)
```

All remaining `TASTE_ENERGY_DEFAULTS` are fixed: discount .95, lambda .9,
epsilon .1, actorRate .05, criticRate .1, tdRmsRate .03125, tdFloor 1e-6,
advantageBound 4, weightBound 8, priorOdds 3. No alternate legacy defaults.
`greedyInference` makes the motor deterministic after probe compaction; it
does not turn acquisition deterministic or remove the existing 95/5 feeding
draws. Preserve the exact freeze/reset/compact functions and RNG states.

Use 24 founders per history and the exact `VALUE_REFERENCE`, with the native
learner, reproduction and mutation disabled as in `TasteExperiment`.
Capacity of the physical world is 240; initial nutrient .4; seasonal off;
challenges off; cueForaging on in the main sequence. No energy/food refill,
revival or founder replacement. Sequence: A 512, B 512, C 512, return-A 256
ticks, total 1,792. Physical tick duration is .1 seconds. Use the existing
cue codebook/resource constructors and all four resource seeds unchanged.

Eight independent histories are paired across these arms, from identical
physical starts, initial learner states and random-stream seeds:

| Arm | N and P behavior | Main worlds per body |
|---|---|---:|
| `candidate` | Fresh initial weights; continuing acquisition A→B→C→A | 8 |
| `unlearned` | Freeze acquisition before tick 1; inference semantics otherwise stock | 8 |
| `frozen` | Same acquisition through A; freeze at entry to B, remain frozen | 8 |
| `reset` | Same acquisition; reset weights/memory at entries to B and C, then continue learning | 8 |
| `acceptCruise` | Always action 0, using that body's actuator and paying its actual costs | 8 |
| `acceptStationary` | Always action 2, using that body's actuator and paying its actual costs | 8 |

Add **one shared eight-history `nativeFullCruise` reference**: native action 0
with movement output 1 (full speed), no learner. It shares the same initial
worlds and is compared with both cohorts; do not simulate it twice.
N:`acceptCruise` is also the native-half-speed reference for P. Thus fixed
pursuit cruise, native half cruise, native full cruise and stationary behavior
are all visible. These cruise comparisons are descriptive, as in v2; they
cannot replace a failed learning contrast or be selected after outcomes.

Copy-control has two meanings, both mandatory. First, the learner code,
configuration and initial state are copied exactly between N and P; only the
actuator differs. Weights can learn within a main world. Second, the direct
transfer battery below copies **acquired weights** from N and freezes them.
No historical winner checkpoint or best founder is selected from old evidence.
Fresh acquisition produces all study checkpoints prospectively.

## Probes and direct body transfer

For each body's candidate, retain factual checkpoints at tick 512 (atA),
1,024 (atB), and 1,536 (atC). Main lifetime scoring includes return-A; retention
and transfer use atC, exactly as the precedent, not weights selected after
return-A. Every probe is a separate frozen continuation of at most 256 ticks.

Run the existing **17-continuation battery per history per body**:

* AtA: `early-A:current,reset` (2).
* AtB: `early-B:current,reset` (2).
* AtC: A and B each with `A,B,current,reset` weights (8 total).
* AtC: odor-free transfer with `current,reset,acceptCruise,acceptStationary` (4).
* AtC: one identical A:A copy/reinstall sham (1).

Reuse already computed probe rows in the pressure battery. Do not execute the
same row twice except the declared sham. All variants within a family share
one physical start and family seed. Saved A/B versions reinstall only their
factual weights into the atC physical world. No probe feeds back into training.
Odor-free transfer uses `enterContinualPhase` for A, cueForaging off, zero cue
and odorPresent false, preserving the stock ecology-context routing.

Also run **eight direct N→P continuations per history** from N's atC:
A:`current,reset`; B:`current,reset`; odor-free transfer:
`current,reset,acceptCruise,acceptStationary`. These switch only the actuator
to P after cloning N's source checkpoint. `current` compacts/freezes N's
acquired weights; `reset` uses the stock reset then compact; fixed versions
use the stock fixed-body replacement. No P acquisition or warmup precedes
these probes. Use the same corresponding probe seeds as N's ordinary battery,
and require matching physical start hashes across native/direct variants.
Carried debt and starting energy are preserved under the same construction.
All acquired-weight hashes must remain constant throughout a frozen probe.

The within-P battery tests whether the algorithm can acquire and retain skills
in P. The N→P battery tests whether skills learned in N survive the actuator
change without further learning. Neither can stand in for the other.

## Counts, prices and hard ceilings

| Collection | Main worlds × ticks | Probe continuations × ticks | Maximum world-ticks |
|---|---:|---:|---:|
| N six-arm reference and its battery | 48 × 1,792 | 136 × 256 | 120,832 |
| P six-arm candidate and its battery | 48 × 1,792 | 136 × 256 | 120,832 |
| Shared native-full reference and direct N→P battery | 8 × 1,792 | 64 × 256 | 30,720 |
| **Whole attempt** | **104 × 1,792** | **336 × 256** | **272,384** |

Hard cap: **440 simulated world executions/continuations**, including the
16 shams; 0 search worlds, 0 exploratory performance worlds, 0 spare banks,
0 repeat performance runs. Maximum founder-ticks: 6,537,216. Death stops
actual work early but does not refund a history or execution slot. There are
eight independent seed histories, not 440 independent experimental units.

Each main arm has a cap of eight worlds/14,336 world-ticks. Each named probe
role has a cap of eight continuations/2,048 world-ticks. In addition, per
execution ceilings are 1,000,000,000 billed policy/observation/actuator scalar
operations for a main world and 100,000,000 for a probe, and 65,536 encoded
learner/actuator bytes per founder at any step. These are stop ceilings, not
extra memory allocations. Actual work and peak bytes must be published.
Probe operation ceilings count additional work after cloning, not inherited
acquisition counters; main ceilings include initialization. Inherited work
remains charged in the source world's ledger and is never erased there.
Aggregate operation ceiling is 137,600,000,000; no unused arm allowance may
be reassigned. Each of the three collection rows has a 600-second wall and
600-second CPU ceiling, summed across partial launches; aggregate 1,800
seconds each. Evidence output ceiling: 8 GiB. A breach precludes PASS; no
extension, thinning, restart or silent omission to fit the cap.

Prices remain `operationEnergy=5e-6/17` and
`byteEnergyPerSecond=1e-5/(17*8)`, using `chargeForStep`, actual encoded storage,
and the existing physical movement/feeding costs. Fixed controls pay their
own real work, not imaginary learner work; their cheaper computation is
reported. No free pursuit calculation or extra rehearsal, reward rescaling,
different founder denominator, or forgiveness of outstanding debt.

Use the runner's energy endpoint
`V=(physicalEnergy-startingEnergy-(outstandingEnergy-startingDebt))/24`.
Publish its work counters and unpaid-work audit alongside it. Because work
performed after the last charge can remain unbilled in the stock harness,
also calculate, on endpoint copies only,
`Vsettled=V-operationEnergy*(pendingEnd-pendingStart)/24`, where pending is
the sum of `scalarOperations-operationsBilled` over all founders. Record
pendingStart as zero for fresh main worlds (initialization is their cost),
and at the constructed probe start before its first decision for probes
(inherited acquisition work is already attributable to the source world).
This is an accounting readback, not
an alteration of learning or its live energy observations. **Every numeric
energy gate must pass using both V and Vsettled**; survival is unchanged.
Do not subtract paid operations again. Report both, including any disagreement.

RSI round docs counted main histories×arms as “worlds” while the runner also
executed probes. For comparison with that ledger, this plan adds **104 main
worlds** (5,128 → 5,232 if fully executed). Separately disclose all **336
probe continuations** and the complete 440-execution study budget. Do not add
440 to 5,128 and present the result as a homogeneous historical total.
Every failed/partial execution, byte, operation and runtime remains in the
attempt ledger. Analytic readback is recorded separately and does not run a
world; any undeclared world replay exceeds the frozen execution schedule.

## Fresh-bank discipline and execution prerequisites

Prospective path: `evidence/body-transfer/v1/fresh-01/protocol.json`;
attempt path: `evidence/body-transfer/v1/fresh-01/attempt-01/`.
Neither is created by this design task. No seed or bank hash is invented here.

Before generation, inventory and hash all prior seed registries. Use the
`scripts/taste-development.mjs:bank()` exclusion scan as the starting method,
including seed 41, its reserved engineering ranges, prior `protocol.json`
seed fields and test/engineering/fixture numeric tokens. **The stock scan
alone is insufficient**: it skips `sources`, `registries`, `engineering`,
`authority-inputs` and `prospective`, and does not discover archive-only
registries. Union all prior evidence registries, reserves, failed attempts,
standalone seed lists and archived handoff protocol/registry metadata into
the exclusion set, including previously generated but unused seeds. Resolve
manifest references and capture their hashes; do not read outcome tapes.
Missing registry coverage blocks fresh qualification, not the design document.

Only after that inventory and the implementation/source freeze, draw one new
eight-history bank with the same `bank()` uint32 rejection-sampling rule:
nonzero seeds, each absent from exclusions and all preceding draws. Each
history has world seed, cue seed, four resource seeds, and A/B/transfer probe
seeds: **72 unique draws**. Reusing these within paired arms/probes is planned
common-random-number pairing; different histories share no drawn seed.
Capture bank bytes, SHA-256, exclusion inventory, generator source and order.
No seed hand-selection, discarded “bad” bank, geometry screen, or outcome peek.

The current runner has no pursuit-body option and its source collector does
not automatically include an added adapter. This is a frozen specification,
**not an executable command claiming otherwise**. A later implementation must
wire exactly this actuator, body-preserving restore/probes, fixed full-speed
reference, exclusions, cost readback and scorer; include the complete import
closure, adapter, scorer and this plan in a captured source manifest before
drawing the bank. Only synthetic non-performance checks may precede that
freeze; no development-world tuning. An inability to implement these semantics
requires a new plan before any evaluation, not an improvised runtime change.

Reference checkout: `9b2538af74df51d6e27ad1fa9dc1d21eae4ac491`.
SHA-256 of principal working-tree files read for this specification:

```text
learning/taste-energy.mjs        24b91847958a363b38984894dac25291c91c1453aa467f35d6dc06a0e4658e8e
learning/taste-experiment.mjs    630d0e82fcc65cf70c3ecf614f8abfd5a3f54a5814f3be68c9cd06f7f56382eb
scripts/taste-development.mjs    12ee7d7df9a14ab2953df14c53d6674dc7eba5c48565f22fc73d68afadec2b4d
learning/pursuit-authority.mjs   0c2b55cf94adb556aa223b89763f311e7600261be4b8ffaee67b930884c26ef3
learning/taste-pressure.mjs      a1604a8eaea49048492bb77e305b03b0c4bb2ff705e8b8658e4e3c890df7756a
```

These identify the design basis, not a completed future adapter audit. The
learner kernel and its semantics must remain unchanged; harness additions
must implement only the specified changes. After the execution manifest is
frozen, any source mismatch invalidates the attempt. Never substitute the
historical qualification hash for current bytes without verification.

One frozen attempt covers N, P and direct transfer together. Any exposure
spends the bank for selection purposes. Collect the full schedule despite
scientific gate failures; stop only for integrity/resource failure. A partial
attempt cannot PASS. No history removal, extra seeds, repeated trial, tuning,
body reselection or changed gates. Failures and spent banks stay spent. A
future retry needs a new versioned plan and fresh seeds; it cannot overwrite
this result. The runner's `qualified:false`/development label is not the
scientific verdict: the frozen scorer and independent readback decide.

## Seven gates: all required, unrounded numbers

For history h and body b, define lifetime effects from **raw arm endpoints**:
`L_b=V(candidate)-V(unlearned)`, `F_b=V(candidate)-V(frozen)`,
`Z_b=V(candidate)-V(reset)`. Define atC-family probe values `v_b(family:version)`.
Use the same formulas separately with settled values. Means are unweighted
over all eight histories; survivor differences are integer sums over histories
with the original 24-founder denominator, never survivor-only averages.

```text
aSkill_b       = v_b(A:A) - v_b(A:reset)
bSkill_b       = v_b(B:B) - v_b(B:reset)
bAcquisition_b = v_b(B:B) - v_b(B:A)
aRetention_b   = v_b(A:current) - .95*v_b(A:A) - .05*v_b(A:reset)
bRetention_b   = v_b(B:current) - .95*v_b(B:B) - .05*v_b(B:reset)
T_b            = v_b(transfer:current) - v_b(transfer:reset)
```

Gates 1–5 apply **separately to N and P**. Requiring the contemporaneous source
to pass prevents a source failure from being called a body-specific transfer
failure. No pooled N/P means or favorable-bank substitution.

| Gate | Frozen energy/count requirement | Frozen survival margin |
|---|---|---|
| 1. Lifetime vs unlearned | mean L > 0; at least 6/8 effects > 0 | candidate minus unlearned sum ≥ 0 |
| 2. Lifetime vs frozen-after-A | mean F > 0; at least 6/8 effects > 0 | candidate minus frozen sum ≥ 0 |
| 3. Lifetime vs reset-at-B/C | mean Z ≥ -0.50 energy/founder; at least 5/8 effects ≥ -1.00 | candidate minus reset sum ≥ -4 |
| 4. Distinct useful skills | aSkill, bSkill, bAcquisition means > 0; aSkill at least 5/8 > 0; bSkill and bAcquisition each at least 6/8 > 0 | No new acquisition-survival test beyond the lifetime and retained-skill survival gates; publish all paired counts |
| 5. A and B retention | Each retention mean > 0; each at least 4/8 effects > 0; each saved-skill mean from gate 4 must be > 0 | current minus saved-family probe survivors ≥ -2 separately for A and B |
| 6. Ecology and direct body transfer | All requirements immediately below | All requirements immediately below |
| 7. Integrity and budgets | Every invariant below; all planned rows present or valid all-dead rows; all caps honored | No revival or dropped deaths |

Gate 5 is a 95%-of-saved-skill contrast with **strictly positive headroom**,
not permission to accept an exactly zero retention mean. A nonpositive saved
skill makes that retention unevaluable and FAIL. Keep A and B separate;
there is no A/B average rescue. Report `aInterference`, net-food interference,
early A/B acquisition and descriptive retention fractions, but do not replace
these gates with those diagnostics or claim that every passing history
demonstrated functional interference.

Gate 6 has three conjunctive parts:

1. **Within-body odor-free transfer, both N and P:** mean T ≥ -0.25;
   every history T ≥ -0.50; current-minus-reset survivor sum ≥ -2 per body.
2. **Direct N→P odor-free transfer:** the same margins for direct
   `transfer:current-reset`: mean ≥ -0.25, every history ≥ -0.50, survivor
   sum ≥ -2. An exact tie meets noninferiority only.
3. **Direct N→P A/B skill transport:** for each f in {A,B}, let
   `K_N,f=v_N(f:current)-v_N(f:reset)` and
   `K_X,f=v_N→P(f:current)-v_N→P(f:reset)`. Require mean K_X,f > 0 and
   at least 5/8 positive for A, 6/8 for B. Also require
   mean `(K_X,f-K_N,f)` ≥ -0.25 and **every** paired effect ≥ -0.50,
   separately by skill. Direct-current minus direct-reset survivor sum must
   be ≥ -2 per skill, and direct-current minus native-current survivor sum
   must also be ≥ -2 per skill. These common-start comparisons test whether
   frozen useful skills survive the new actuator, not just whether an
   odor-free fallback ties reset.

All transfer contrasts against pursuit cruise, native cruising references
where available, and stationary controls are published without an additional
post-hoc gate. Direct transfer is limited to these retained A/B skills and
ecology behavior; it does not establish arbitrary morphology generalization.

Gate 7 requires absolute physical accounting residual < 1e-7 at every
reported endpoint; debt reconciliation < 1e-8; matched initial physical
hashes; immutable source/bank hashes; no revival, refilling or selective
founder removal; unchanged frozen weights; equal sham outcomes; and complete
operation/storage/runtime accounting including the actuator and unpaid-work
readback. Missing atC because all founders died produces the stock zero
probe row, never a replacement history. Missing data for any other reason
invalidates the attempt. Zero probes cannot establish skill existence.

Also require evidence that the actuator change actually executed: on P's
candidate main sequence, in **each history**, at least one live decision with
action 0/1 must have pursuit movement -1 while the native mapping on that
same raw input/action would have movement 0. Count this from factual raw
inputs in observer readback, without running extra worlds. This nondegeneracy
check supplies no outcome-based selection and cannot establish benefit by
itself. If absent, the attempted new-body test has no qualifying exposure.

## Interpretation and anti-footguns

**PASS requires all seven gates, both energy readbacks and all caps.** A FAIL
is not replaced by a score, a survivor anecdote, a successful software test,
or the best subset of histories. Report every per-history effect and survivor
count, gate verdict, source hash, bank hash and budget total. All comparisons
are paired by history; do not treat founders or probe copies as independent
replicates. No ranking or selection stage exists in this study.

Tie rule: a beat means a strict positive unrounded effect. Equality never
counts toward a positive-history quota; equal aggregate values are a tie,
not a winner. Inclusive noninferiority boundaries pass exactly as written.
No tolerance turns zero into positive. Conversely a small positive value
passes its strict mean bar if every other requirement holds. Bars never
move in either direction, including after an expensive or nearly passing run.

Same-bank attenuation accounting is mandatory. Publish `mean L_P`,
`mean L_N` and `mean(L_P-L_N)`, plus raw candidate endpoints and P-minus-N
survival. If both L values are positive but the last quantity is negative,
report **learning retained with attenuation**. It is not silencing; nor is a
body-level energy gain necessarily a greater learning benefit. Report the
corresponding per-skill differences. Do not demand P beat N on lifetime to
rescue or reject a result: preservation under a changed actuator is the claim.
The native bank is an explanatory control, not a movable acceptance bar.

The [fresh-eval correction](RSI_FRESH_EVAL_CORRECTION.md) is binding:
`results.sequence` already equals candidate-minus-unlearned and duplicates
`controlComparisons.unlearned`. **Never subtract those two fields.** Rebuild
every effect from raw endpoints and cross-check both stored representations.
Follow the explicit gate accounting of [Gen20](RSI_TASTE_GEN20_EVAL.md), not
its historical headline count or an aggregate search score. The newest
[progress entry](PROGRESS.md) and definitive synthesis govern program standing.

Observer neutrality: the learner may receive only its existing raw senses,
four observed odor signs, contact/odor presence, own energy, executed-action
history, own signed intake and terminal state through the existing API.
No patch IDs, patch indices, cue IDs, valence labels, phase/family IDs, body
labels, codebooks, resource seeds, oracle values, target coordinates or other
agents' private outcomes may cross the body/learner boundary. Phase labels
belong to scheduling and scoring only. `pursuitMotor` receives raw senses and
chosen feeding sign only. New diagnostic annotations are write-only to an
observer; never consumed by action selection or replay.

Validate observer-on/off equality on synthetic inputs before bank creation;
observers must not draw RNG values, reorder patches/agents, mutate checkpoints
or change billed learner work. Post-run annotations may use hidden identity
for audit but cannot affect a world, select a history, or rescue a gate.
No repurposing the census's hidden target annotations as a new sensor. Pure
observer analysis is outside agent energy and must be separately reported;
all computations used to act belong inside the paid budget.

## Stakes and terminal verdicts

* **PASS:** this particular unchanged learning mechanism and its frozen A/B
  skills generalize to the specified pursuit actuator under the declared
  costs. Unlock a separately predeclared **Option B: new sense** experiment
  and consideration of reopening bounded RSI on that new substrate. This
  result itself accepts zero algorithm revisions and provides zero directed
  search wins. Reopened RSI starts at 0/2 and retains the requirement for
  two successive fresh accepts plus two matched-budget directed-search
  advantages, copy controls and total-budget accounting. The closed negative
  synthesis remains intact.
* **Scientifically valid FAIL with N passing:** a body-specificity finding for
  this learner/actuator/task pairing. State whether new-body acquisition,
  retention, survival or frozen skill transport failed. It remains a
  publishable boundary result, even if lifetime energy rose. No Option B/RSI
  reopening is earned by this route and no actuator sweep follows under v1.
* **N fails its source gates:** the fresh source did not requalify; no overall
  PASS and no clean attribution to the changed body. Publish both bodies'
  full outcomes as a source-generalization limitation. Historical passes
  stand on their original banks.
* **Integrity, exposure or budget failure:** INVALID/INCOMPLETE, no PASS and
  no biological/body-specificity conclusion. Preserve all partial costs and
  spent seeds. An implementation failure is not scientific evidence of
  learner failure.

This document is the only artifact of the present task. Implementation,
registry recovery, bank generation and performance evaluation are future work.
