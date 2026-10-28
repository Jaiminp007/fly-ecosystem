# Motor-anchor study — plan V1 (FROZEN, Phase D only)

Frozen 2026-10-28. Status: FROZEN, unexecuted. No performance work may run
outside this plan. Single authorized dev attempt. Basis:
`docs/RETENTION_MECHANISM_RESULTS_V1.md` (SUPPORT-H1-motor, H1m, M-ACTOR
addendum) and `docs/BODY_TRANSFER_RESULTS_V3_DEV.md` (dev-gate pattern).
Gen1 R=4 base flags are unchanged (greedy/orthogonal/rate-1/ecology 96-motor
16-taste/hold-1/progress/renewal-.1/…/greedyInference); the ONLY learner
delta is the opt-in actor anchor below.

## Questions (frozen)

D1. Are actor cruise decisions near the greedy threshold (decision-relevant)
or saturated (anchor would repeat V3's sub-threshold null)? Margin readback
at atA/atC, λ=0 control.
D2. Does a rotation-damped slow-direction anchor on `weights.actor` raise
A-retention without level loss? λ menu, dev bank, conjunctive bar.
D3. Do A/B phases share motor block 1 (H1m)? Block-visit logs from mains
(descriptive, zero extra worlds).

## Instrument (frozen; to be built, fixture-tested, then run once)

M-ACTOR in `learning/taste-energy.mjs`: new opt-in config
`motorAnchorRate` (μ=1e-3 frozen) + `motorAnchorStrength` (λ; 0 default).
When λ>0: per-learner `slowMotorDir` (96-dim, zeros) tracks the fast actor
(`s←(1−μ)s+μ·w`); each motor update (`progressUpdate` admitted steps and
`motorUpdate`) adds the rotation-only pull `+λ(s/|w||s| − w·c/|w|²)`,
skipped while either norm is zero, magnitudes free, all ops billed through
`m`. Taste path untouched. λ=0 allocates nothing and executes no new code
path → Gen1 bit-identity (pinned by fixture).
`slowMotorDir` is checkpointed/restored/reset/validated exactly like
`slowDir` (V3 pattern).
Margin/block logging: instrumented A-probes record per-decision cruise
`baseProbability` (margin = |p−.5|) and context-block index; logged into
probe endpoints, billed like normal probe ops. No behavior change.

## Sampling (frozen)

ONE dev bank, 4 histories × 9 seeds = 36 unique fresh seeds (V3-Dev shape:
seed/cueSeed/7 probeSeeds), N-body only, 6 arms
(candidate/unlearned/frozen/reset/acceptCruise/acceptStationary), 1792-tick
mains, 12-probe pressure battery + sham per history (V2 battery minus
early-A/B, which Phase D omits). Fresh seeds drawn once by the runner;
union-exclusion covers ALL spent banks (v1-fresh, v2-fresh, v3-dev) plus
every `evidence/**`, `tests/**`, `scripts/*engineering*`/`*fixtures*` token
registry plus the new instrument/plan tokens. λ menu {0, 0.02, 0.08}
(V3 comparability), μ=1e-3; λ=0 is the bit-identity control.

## Estimands and decision rule (frozen)

Per-λ 4-history means: ΔA-ret = A-ret(λ) − A-ret(0); ΔB-ret; Δlevel
(candidate−unlearned); actor alignment cos(actor_C, actor_A) from anchors;
margin sanity: threshold-fraction (share of A-probe cruise decisions with
|p−.5|<0.1) and mean margin at C vs control.
Best-λ by ΔA-ret. **DEV-GO iff ALL hold:** ΔA-ret ≥ +0.15 AND ΔB-ret ≥ −0.10
AND Δlevel ≥ −0.20 AND alignment strictly above control AND threshold-fraction
not above control by more than 0.05 AND mean margin not below control by more
than 0.05. Else **DEV-NOGO** (line closes, zero qual spent). H1m block logs
are descriptive and cannot rescue a NOGO.

## Costs and ceilings (frozen)

72 mains + 156 probes = 228 executions max (≤276 V3-Dev ceiling, reused);
168,960 world-ticks, ~4.05M founder-slots; aggregate op cap 90e9 (reused).
Per-row wall/CPU + byte caps inherit `body-transfer.mjs`. Margin/block
logging adds no executions (in-probe logging only).

## Controls and stopping rules (frozen)

One attempt. Fixture tests (fresh synthetic seeds, never the dev bank):
λ=0 twin-run bit-identity vs Gen1; billing floor (λ>0 bills strictly more
ops); rotation property (pull ⊥ w, magnitudes free); zero-norm guard;
checkpoint restore/reset of `slowMotorDir`; all green before the run.
Halt → INCOMPLETE: anchor-digest mismatch, sham non-identity, weights-digest
breach, op-cap breach, count mismatch. No rescoring of outcomes, no added
histories/conditions, no second attempt, no tuning on any seed, no moved
bars, no RSI claim. DEV-NOGO closes the line (V3 precedent); DEV-GO unlocks
ONLY a separately frozen Phase-Q on a fresh qual bank — never in this goal.
