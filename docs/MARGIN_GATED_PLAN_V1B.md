# M-GATE plan amendment V1b (pre-execution correction)

Frozen 2026-10-28. Amends `docs/MARGIN_GATED_PLAN_V1.md` + V1a ONLY as below.
No M-GATE worlds run yet. Reason: OBSERVED breakage, not theory — the frozen
default `marginGateTau=Infinity` fails the committed suite two independent
ways (full-suite triage: ~42 failures over a 6-failure pristine baseline):

1. `encodedStateBytes` (`learning/sarsa-experiment.mjs:16`) asserts
   `Number.isFinite` on every numeric state value
   (`taste-experiment.mjs:78` `chargeForStep`). Infinity default → every
   charged step throws. Null is byte-safe (1 byte, no assertion).
2. JSON checkpoint round-trips (`restoreTasteEnergyBody(JSON.parse(
   JSON.stringify(s)))`, the universal test/dev harness pattern) map
   Infinity→null, so the frozen default cannot survive a restore boundary;
   downstream config deepEquals then see `marginGateTau: null`.
3. Default-closed suppresses the V3 anchor in all legacy `strength>0` paths
   (including V3's own synthetic tests, which never set `motorPending`),
   breaking 4 committed behavior tests.

## Changes

1. **Default 0** (was Infinity): destructure, `TASTE_ENERGY_DEFAULTS`,
   old-checkpoint compat (`undefined→0`), restore (`??0`). Semantics: gate
   always-open = exact pre-gate V3 behavior. Gen1 bit-identity is preserved
   by the outer `slowAnchorStrength>0` condition (gate unreachable at 0),
   independent of the default. V3-era restored checkpoints (strength>0) keep
   their saved behavior under compat-0.
2. **Off/control encoding is explicit null** (was Infinity). Assert accepts
   `null | finite≥0`; **Infinity is rejected** (fail-fast: it cannot survive
   the JSON/bytes checkpoint paths). Study grid becomes τ ∈ {null, 0, 0.2};
   G1/G2/G3′/G4/G5 apply unchanged with "τ=∞" read as "τ=null".
3. **Always-bill gate**: `marginGatePass` bills sub+mul+less = 3 ops on EVERY
   path (open, closed-by-tau, closed-by-null, fail-closed) — comparison runs
   unconditionally, result ANDed with the ok-flag. Uniform across arms AND
   across restore boundaries (null survives JSON, so nothing changes at a
   restore). This is what makes G3′'s billed-equality comparison valid.
4. Consequential test updates (disclosed, behavior-preserving): V3 synthetic
   anchor tests set `motorPending` explicitly (the only way to open a
   fail-closed gate in-process); expected config literals gain the
   `marginGateTau: 0` key. No tested behavior changes.

## Explicitly not changed

Gate formula (margin ≥ tau), fail-closed direction, 3-op billing count, bank,
grid values (modulo ∞→null), G1/G2/G4/G5, caps, single attempt, non-inclusions.
