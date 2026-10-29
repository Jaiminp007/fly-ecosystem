# M-GATE plan amendment V1c (pre-execution arithmetic/config correction)

Frozen 2026-10-28. Amends V1/V1a/V1b ONLY as below. No M-GATE worlds run yet.
Reason: V1's execution parameters were transcribed inconsistently with the
harness they invoke. The G2 bars/scales derive from the V3 dev harness
(`scripts/body-transfer-dev.mjs`: mains `BT_TICKS=1792`, 6 arms, 13-exec
batteries, `DEV_MU=1e-3` rate, strength grid {0,.02,.08}); the plan must name
that harness exactly, or G2 compares across different learning regimes.

## Changes

1. **Mains are `BT_TICKS=1792`** (V1's "512" corrected — that number belonged
   to the D1 synthetic check, not the dev harness). G2's effect sizes assume
   1792-tick learning; nothing else changes.
2. **Anchor config: `slowAnchorRate=DEV_MU=1e-3`, `slowAnchorStrength=0.02`**
   (V1 transposed the labels: V3 varied *strength* {0,.02,.08} at fixed rate
   `DEV_MU`. "V3's smallest-nonzero" always meant strength 0.02.)
3. **Totals: 96 mains + 156 probes = 252 executions** (V1a's "144/300" was bad
   arithmetic — 4 configs × 36 conflated bank *seeds* with *mains*. Real
   count: 4 configs × 4 histories × 6 arms = 96 mains; 3 gated configs × 52
   probes = 156). Caps UNCHANGED (exec ≤300 satisfied with headroom: 252).
   Expected ledger ≈212k ticks / ≈5.1M founder-slots / ≈11e9 ops (≤20e9).
4. Control reads "τ=null (off)" everywhere V1/V1a said "τ=∞" (per V1b).

## Explicitly not changed

Grid values {null,0,0.2} + Gen1 fourth, bank seeds 382001–382036, 6 arms,
13-exec battery, G1/G2/G3′/G4/G5 (modulo the null-control reading), caps,
single attempt, non-inclusions.
