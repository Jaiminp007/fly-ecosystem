# Option A — New body transfer, frozen study plan v2 (translation-preserving pursuit)

Frozen 2026-10-28. Status: DESIGN ONLY; no bank generated, no worlds run,
no qualification or RSI claim. One new gated body, one in-bank mechanism
control, one prospective bank, one attempt.

## Question and standing

**Can the unchanged Gen1 R=4 taste-ecology learner retain its qualified
lifetime-learning and A/B skills under a pursuit-steering actuator that
preserves translation, including transfer of frozen acquired weights from
the native actuator?**

V1 (`BODY_TRANSFER_PLAN_V1.md`, results in `BODY_TRANSFER_RESULTS_V1.md`)
returned FAIL-source: the native source missed requalification by 0.076 on
A-retention (mean −0.0755, needs > 0), so no body attribution was permitted.
But V1 also produced a decisive mechanistic observation: the harsh
turn-before-translate pursuit body converted 15,446–17,521 live cruise
decisions per history into stationary stops (~36–41% of all live decisions),
trailed the native lifetime by 3.42 energy/founder, and collapsed direct
skill transport (mean gaps −0.24 A / −0.99 B, per-history floors −1.07/−2.84).
The V1 actuator is strictly translation-dominated: cruise outputs are
−1-or-0, never better than native half-speed. Any learning comparison under
it confounds cognition with lost opportunity to act.

V2 isolates the cognitive question. Body Q keeps the pursuit heading law
(bearing-proportional turn, same deadband) and changes exactly one thing:
cruise always translates. If V1's transport collapse was mechanical
translation loss, Q should transport frozen skills near their native values
(gaps ≈ 0, far above the ±0.1–0.3 bank-noise scale); if skills depend on
native heading dynamics, Q will fail like P. Both outcomes are predeclared
informative (see stakes). The harsh V1 actuator is retained in-bank as body
P, a descriptive mechanism control — not gated, not verdict-bearing — so the
paired per-history Q-vs-P contrast is measured on the same bank, same source,
same seeds.

This still serves [Vision milestone 4](VISION.md) under the same standing as
V1: the entry evidence is unchanged (v2 qualification, 14-bank robustness,
terminal negative synthesis closing bounded RSI at 5,128 worlds). No replay,
memory, learning-rate or search revision is permitted. The seven gates below
are the identical v2 numeric bars, applied to N and Q. These are prospective
qualification rules, not a powered estimate; eight histories do not resolve
every effect near 0.1.

## Actuator specifications (exact)

Let N denote the native `tickMotor` body (unchanged stock path). Let P denote
the V1 harsh pursuit body, byte-identical to the V1 harness: for every
decision with raw senses `raw` and chosen action, `s=+1` for actions 0/2 else
`s=-1`; `pursuitMotor(raw,s).outputs`; actions 2/3 force movement output −1;
no `tickMotor` call; no `cruiseSpeed` overwrite; +2 adapter predicates billed.

Let Q denote the new translation-preserving pursuit body. For every decision
with raw senses `raw` (17-vector) and chosen action 0–3, `s=+1` for actions
0/2 else `s=-1`:

```text
magnitude = raw[0]^2 + raw[1]^2 + raw[2]^2
if !(magnitude > 0):
  turn = tanh(1.8 * (raw[10] - raw[11]))
else:
  bearing = atan2(s*(raw[2]-raw[1]), s*raw[0]); -pi canonicalized to +pi
  turn = clamp(bearing/.28, -1, +1)
move = (action < 2) ? 0 : -1
outputs = [turn, move, s(feed), -1, 0]
```

That is the V1 pursuit turn law with the movement penalty removed: cruise
(actions 0/1) always outputs movement 0 — physically identical translation
to native cruise (`speed=(0+1)/2*g.speed`, half speed) — while heading
follows the bearing law instead of the native `tanh(attraction+wall)` law.
Stationary actions keep the primitive's turn with forced zero translation.
Charge the prototype's 9 or 16 operations plus two adapter predicates per
decision, exactly as P. No wall guard, speed tuning, or persistent actuator
memory. Q pays the same delivered compute as P; any Q-vs-P difference is
actuation, not billing.

World geometry, food, resource phases, sensing, noise, energy laws, and the
learner (Gen1 R=4 flags below) are identical across N, P, and Q. Fixed arms
use the arm's own actuator and pay its real costs.

Nondegeneracy (exposure) requirements, per history, counted live by observer
readback without extra worlds:
- P (unchanged V1 check): ≥1 live cruise decision with pursuit movement −1
  where native would be 0. Expected in the thousands (V1: 15k–17k).
- Q (new): ≥100 live cruise decisions where the Q turn differs from the
  recomputed native turn `motorPrimitive(raw, accept?1:-1)[0]` by >1e-6,
  proving the heading interface actually differs; AND zero live cruise
  decisions with Q movement ≠ 0 (translation-preservation assertion — any
  nonzero cruise movement under Q is an integrity failure, not a pass).
  The ≥100 bar is two orders below the expected thousands; it guards
  void-of-exposure, not benefit.

## Frozen learner, worlds and arms

Gen1 R=4 base, identical in N, P, and Q (only the actuator differs):

```text
feedingRule=greedy       tasteRepresentation=orthogonal   tasteRate=1
motorRepresentation=ecology (96 motor, 16 taste dimensions)
holdTicks=1             motorRule=progress               renewalRate=.1
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
cruiseSpeed=0 (N; P/Q use their movement mappings above)
```

All remaining `TASTE_ENERGY_DEFAULTS` fixed as in V1 (discount .95, lambda .9,
epsilon .1, actorRate .05, criticRate .1, tdRmsRate .03125, tdFloor 1e-6,
advantageBound 4, weightBound 8, priorOdds 3). `greedyInference` semantics,
freeze/reset/compact functions, and RNG states preserved exactly.

24 founders, `VALUE_REFERENCE`, reproduction/mutation disabled, capacity 240,
nutrient .4, seasonal off, challenges off, cueForaging on in mains, sequence
A 512 / B 512 / C 512 / return-A 256 (1,792 ticks, DT .1s), same codebook and
resource constructors.

Eight independent histories, paired across N/P/Q arms from identical physical
starts, initial learner states, and random-stream seeds:

| Arm | Behavior (each body) | Mains per body |
|---|---|---:|
| `candidate` | Fresh weights; continuing A→B→C→A | 8 |
| `unlearned` | Freeze before tick 1; stock inference | 8 |
| `frozen` | Same acquisition through A; freeze at B | 8 |
| `reset` | Same acquisition; reset at B and C entries | 8 |
| `acceptCruise` | Always action 0, own actuator, real costs | 8 |
| `acceptStationary` | Always action 2, own actuator, real costs | 8 |

One shared eight-history `nativeFullCruise` reference (native action 0,
movement 1, no learner), compared with all cohorts; simulated once.

Copy-control as in V1 (learner/code/config/state identical across bodies;
fresh prospective acquisition only), plus direct-transfer batteries: eight
N→P continuations per history (V1 battery, unchanged) AND eight N→Q
continuations per history (A:`current,reset`; B:`current,reset`; odor-free
`current,reset,acceptCruise,acceptStationary`), cloning N's atC with frozen
weights, same probe seeds as N's battery, matching physical starts. P probes
and P direct battery are descriptive mechanism data, not gates.

Probe batteries per body (candidate checkpoints atA/atB/atC): the same
17-continuation battery as V1 for N and Q (gated), and the same battery for
P run descriptively (no quotas apply).

## Counts, prices and hard ceilings

| Collection | Mains × ticks | Probes × ticks | Max world-ticks |
|---|---|---:|---:|
| N six-arm reference + battery | 48 × 1,792 | 136 × 256 | 120,832 |
| Q six-arm candidate + battery | 48 × 1,792 | 136 × 256 | 120,832 |
| P six-arm mechanism control + battery | 48 × 1,792 | 136 × 256 | 120,832 |
| Shared native-full + N→P + N→Q direct | 8 × 1,792 | 128 × 256 | 47,104 |
| **Whole attempt** | **152 × 1,792** | **536 × 256** | **409,600** |

Hard cap: **688 simulated world executions/continuations** (152 mains,
536 probes, incl. 3×8 shams); 0 search/exploratory/spare/repeat worlds.
Max founder-ticks 9,830,400. Per-arm caps: eight worlds/14,336 ticks per main
arm; eight continuations/2,048 ticks per named probe role. Per-execution
ceilings unchanged: 1e9 billed scalar ops (mains), 1e8 (probes), 65,536
encoded bytes/founder. Aggregate operation ceiling 240,000,000,000 (≈9× the
V1-scaled expectation of ~25e9). Four collection rows (N, Q, P,
shared-direct), each 600 s wall + 600 s CPU ceilings (summed over partial
launches; aggregate 2,400 s each). Evidence output ceiling 8 GiB. Breach
precludes PASS; no extension, thinning, or silent omission.

Prices: `operationEnergy=5e-6/17`, `byteEnergyPerSecond=1e-5/(17*8)`,
`chargeForStep`, actual encoded storage, physical movement/feeding costs.
Fixed controls pay their own real work. Endpoint `V` and settled `Vsettled`
exactly as V1 (pending = scalarOperations − operationsBilled; pendingStart 0
for fresh mains, constructed-probe start otherwise). **Every numeric energy
gate must pass under both V and Vsettled**; survival unchanged. For RSI
ledger comparability this plan adds **152 main worlds** (5,128 → 5,280 if
fully executed); all 544 probe continuations disclosed separately; every
failed/partial execution, byte, operation and runtime stays in the ledger.

## Fresh-bank discipline and prerequisites

Prospective path: `evidence/body-transfer/v2/fresh-01/protocol.json`;
attempt path: `evidence/body-transfer/v2/fresh-01/attempt-01/`. Neither
exists at freezing.

Same union-exclusion method as V1 (bank-scan plus all evidence
`protocol.json` seed fields, test/engineering/fixture numeric tokens,
handoff registries/authority-inputs/prospective lists, failed attempts,
standalone seed lists), now additionally covering the entire V1 study
(fresh-01 bank 72 seeds, V1 attempt artifacts). One new eight-history bank,
uint32 rejection sampling, nonzero seeds, 72 unique draws (world, cue, four
resource, A/B/transfer probe seeds per history). No hand-selection, geometry
screen, or outcome peek. Implementation + source freeze before the draw; only
synthetic non-performance checks before it (fresh synthetic seed range,
disjoint from V1's 355001–355009). Post-freeze source mismatch invalidates
the attempt. One frozen attempt covers N+Q+P+direct; collect the full
schedule despite scientific gate failures; stop only for integrity/resource
failure. No history removal, extra seeds, repeats, tuning, reselection, or
gate changes. Spent banks stay spent; V1 seeds are never reused.

Reference checkout for the V2 design basis: post-V1-merge main plus the V1
study commits (PR #3). Record SHA-256 of the principal files at
implementation freeze (same set as V1 plus this plan and any new tests).

## Seven gates: all required, unrounded numbers (N and Q)

Definitions identical to V1 (raw-arm-endpoint effects `L/F/Z`; atC-family
`aSkill/bSkill/bAcquisition/aRetention/bRetention/T`; means unweighted over
eight histories; survivor sums over 24-founder denominators; V and Vsettled
both required). Applied separately to N and Q. P is reported in the same
format with no quotas and no verdict contribution (predeclared).

Gates 1–7, bars, tie rules, attenuation accounting, correction binding
(`results.sequence` ≡ candidate−unlearned; never subtract
`controlComparisons.unlearned`), and observer neutrality: unchanged from V1.
Gate 6 has three conjunctive parts with Q in the gated role: (1) within-body
odor-free transfer for N and Q; (2) direct N→Q odor-free transfer; (3) direct
N→Q A/B skill transport (same quotas: A ≥5/8 positive, B ≥6/8; paired gaps
mean ≥ −0.25 and every history ≥ −0.50 per skill; survivor floors −2). The
N→P direct battery is reported identically but ungated.

Gate 7 adds the Q translation assertion (zero nonzero cruise movements) and
the Q heading-exposure quota (≥100/history) alongside the V1 invariants
(residual <1e-7, no revival vs per-source anchors, nondegMin P ≥1/history,
nondegMin Q ≥100/history, output <8 GiB, all caps honored).

## Interpretation, mechanism contrast, and anti-footguns

PASS requires all seven gates (N+Q, V+Vsettled) plus caps. Beyond the verdict,
publish the predeclared paired mechanism contrast on the same bank: per-history
`K_Q−K_N` vs `K_P−K_N` for skills A/B and lifetime `L_Q−L_P`. The design
hypothesis is `K_Q−K_N ≈ 0` while `K_P−K_N ≈ −0.2..−1.0` (V1 scale): recovery
of a full energy unit of transport under Q would exceed the ±0.1–0.3
bank-noise scale by several multiples and identify translation loss — not
heading dynamics — as V1's killer. If instead Q ≈ P ≪ N, the boundary is the
heading coupling itself (skills depend on native heading dynamics), equally
publishable. This contrast is descriptive support, never a rescue: it cannot
convert any FAIL into a PASS or move any bar.

V1's lesson on retention stands: the 95%-of-saved-skill bar punishes strong
acquisition (V1 histories with the best saved A failed retention while weak
ones passed). Report the same acquisition-vs-retention scatter for N and Q;
do not select, reweight, or average histories by it.

## Stakes and terminal verdicts

* **PASS:** this learning mechanism and its frozen A/B skills generalize to
  the translation-preserving pursuit actuator under declared costs. Unlocks
  consideration of a separately predeclared **Option B: new sense**
  experiment and of reopening bounded RSI on that new substrate (reopened
  RSI starts at 0/2 with the retained successive-accepts, directed-search,
  copy-control, and total-budget requirements). Zero algorithm revisions
  accepted here; zero directed-search wins banked. The V1 FAIL and the
  negative synthesis remain intact as the record of the harsh actuator and
  the dial program.
* **Scientifically valid FAIL with N passing:** body-specificity boundary for
  this learner/actuator/task pairing — state whether acquisition, retention,
  survival, or frozen skill transport failed, and report the P-vs-Q contrast
  as the mechanism evidence. Publishable; no Option B/RSI reopening by this
  route; no further actuator sweep under v2.
* **N fails its source gates:** fresh source did not requalify; no PASS and
  no clean attribution (same refusal as V1). Publish all bodies' outcomes
  as a source-generalization limitation. Standing passes keep their banks.
* **Integrity, exposure, or budget failure:** INVALID/INCOMPLETE, no PASS,
  no biological conclusion. Preserve all partial costs and spent seeds.

This document is the frozen specification. Implementation, registry recovery,
bank generation, and performance evaluation are future work under the V2 goal.
