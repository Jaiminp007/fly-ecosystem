# Margin-gated protection plan V1 (M-GATE line)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized Phase-D attempt only. D1-acceptance (V4) is the prerequisite;
V1/V2/V3/M-ACTOR and D1-FIX V1–V4 stand untouched.

## Hypothesis (one sentence)

V3's uniform directional protection did nothing-or-harm because it fires on
every taste update including uncertain ones; gating the SAME pull on the
accepted D1 motor-margin (certainty) tests whether protection helps exactly
when the policy is confident — a new move, not a V3 re-roll
(τ=0 replicates V3-uniform by construction; τ=∞ is the no-protection control).

## Instrument delta (exact, frozen formula)

`learning/taste-energy.mjs` only; default-off (Gen1 bit-identical: new code
runs only when `slowAnchorStrength>0`, which is 0 in Gen1):

1. New config `marginGateTau` (margin units, default `Infinity` = never gate
   open): options allowlist + destructure + `assert(v===Infinity||v>=0)` +
   restore-compat + restore path (same five places as `marginReadback`).
2. New `marginGatePass(state,m)`: fail-closed `false` if `!state.motorPending`
   or non-finite `baseProbability`; else `d=m.sub(bp,0.5)`, `m2=m.mul(d,d)`,
   pass `m.less(tau*tau,m2)||tau*tau===m2` (3 billed ops/decision, UNIFORM
   across arms since the call site runs whenever `slowAnchorStrength>0`).
   τ=0 passes always (m2≥0); τ=∞ never passes (m2 finite).
3. Line-152 call site becomes
   `if(strength>0 && marginGatePass(state,m)) anchorTasteDirection(state,m)`.
   No rng draws added, no state perturbation besides the gated pull itself;
   margin is a pure local (never stored).
4. τ=∞ arm: anchor never applies; actions/weights ≡ V3-λ mechanics, values
   differ from V3 only by the uniform +3-ops/decision billing (within-study
   comparisons apples-to-apples). τ=0 arm: gate always passes → bit-identical
   actions/weights to the V3 uniform pull (replication check by construction).

Code-path facts frozen in (read-only, verified 2026-10-28): at the line-152
taste-update point `state.motorPending` is still set (motor consumption runs
later, :332+), holding the just-executed decision's `baseProbability`; in
probes the taste block (:323) is skipped so the gate is unreachable there —
protection acts in mains only, read out in probes (V3 pattern). Motor-progress
records in mains already carry `baseProbability`+`admitted`+`target` (spread
of `motorPending`, :271-285) — the relevance gate needs NO instrument change.

## Bank + grid (fresh, union-excluded)

- Dev bank `evidence/margin-gated-dev/fresh-01/`: 36 mains (4 histories × 9
  variant seeds 382001–382036), ledgered in `fixture-seeds-01.json` BEFORE
  use; mains 512 ticks, BT ecology options + slowAnchorRate=0.02,
  slowAnchorStrength=V3 value. Union-excludes every prior bank/protocol seed,
  every registry/fixture token, and fixture ranges 379xxx/380xxx/381xxx.
- Grid (rate fixed, τ varies): τ ∈ {∞ (control), 0 (V3-uniform replication),
  0.2}. Each config runs all 36 mains (emit on, for G1) + the 52-probe
  retention battery (13 keys × 4 histories, 256 ticks; V3/M-ACTOR battery).
- Totals: 108 mains + 156 probes = 264 executions. Caps (script-enforced,
  fail-closed): exec ≤300, scalarOps ≤20e9, wall ≤3600s, storage ≤200MB.
  Ticks/slots ledgered (expected ≈95k/≈2.3M).

## Conjunctive bars (all must pass → GO; any fail → line CLOSED, no Phase Q)

- G1 relevance (measurement gate, control-arm mains only): among ADMITTED
  motor-progress records (≥1000 required, else NOGO), top-margin-tercile
  `target==1` rate exceeds bottom-tercile by ≥0.10 absolute. Fail → gating is
  baseless → NOGO regardless of G2.
- G2 effect (τ=0.2 vs τ=∞ control, V3 aggregates/scorer): ΔA≥+0.15 AND
  ΔB≥−0.10 AND level≥−0.20 AND alignment up. Fail → CLOSE.
- G3 fidelity: per-decision op-count variance across arms == 0 (uniform
  margin billing; proves no state-dependent divergence); τ=∞ anchor
  application is a no-op path (never passes by construction audit).
- G4 caps held (ledger). G5: full suite shows no NEW failures vs stashed
  baseline; gate fixture tests (τ ∈ {0, 0.2, ∞} + null-pending fail-closed +
  billing-uniformity) green BEFORE execution.

## Not included (unchanged)

No motor-side gating (M-ACTOR exhausted), no H2, no ELSEWHERE sensing, no
qual/reserve contact, no bank reuse, no learner revision beyond the gate, no
RSI, no Option B, no second attempt, no rescoring. On GO: the gated-protection
effect is DEV-accepted and a Phase-Q proposal may be made — never in this
plan. On NOGO: M-GATE closes; negatives preserved; next line (if any) needs
its own frozen plan.
