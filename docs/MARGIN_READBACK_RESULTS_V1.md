# Margin-readback repair V1 — results (attempt-01)

Frozen 2026-10-28. Plan: `docs/MARGIN_READBACK_PLAN_V1.md`.
Verdict: **NO-GO per frozen bars** (G1 ✗, G2 ✓, G3 ✗, G4 ✗).
Correction (read-only, from ledgered artifacts — no new worlds, no rescoring
of rows): the instrument met its spec exactly; three bar/script defects
explain all three failures with exact arithmetic. D1-FIX V1 closes NO-GO;
a corrected V2 plan is authorized, V1 preserved as a negative.

## What ran (single authorized attempt, within all caps)

- `evidence/margin-readback/attempt-01/`: `synthetic.json`, `spent-bank.json`,
  `ledger.json`, `attempt.json` (+ sources snapshot). 17 executions
  (1 synth main 512t×4 + 3 synth probes + 13 battery probes),
  4608 world-ticks, 84992 founder-slots, ~2.05e8 scalar ops — all ≤ caps.
- Seeds: 9 fresh synthetic (380001–380009, ledgered in
  `evidence/margin-readback/fixture-seeds-01.json` BEFORE use — now spent,
  never reusable) + ONE spent-bank row (V2 history 2789221780, MEASUREMENT
  label). No bank drawn, no qual touched.

## Bar results

| Bar | Result | Cause (artifact-pinned) |
|---|---|---|
| G1 synthEmit (A:current ≥1 shaped record) | ✗ | Script checked `perProbe['A:current']`; direct `runTasteProbe` calls emit RAW events keyed `'main'` (battery-only wrapping gives probe keys). Records WERE emitted: 1024 events. |
| G2 synthNegative (reset emits 0) | ✓ | Fixed program never calls choose — no spurious path. |
| G3 synthBilling (survivors+value identical, ops greater) | ✗ (value clause) | Survivors 4=4 ✓, ops strictly greater ✓ — but value differs by EXACTLY the billed energy (proof below). The bar contradicts the plan's own billing spec. |
| G4 spentEmit (5 keys n>0, digest unchanged) | ✗ (collector) | Battery ran clean (survivors 11–19, anchor digest `e0811f93…` unchanged); all ~4.8k/key events rejected by the collector's hardcoded `phi.length!==16`. |
| G5 no-new-failures | ✓ | 6 named failures identical to stashed-pristine baseline; worker-508 load flake passes standalone (3/3); 4/4 new fixture tests pass in-suite and standalone. |

## Correction proof (read-only)

1. **Emission works.** `withEmit.perProbe.main`: events=1024 = 4 founders ×
   256 ticks (BT options `holdTicks:1` → every decision emits). All 1024
   passed the record gate (numeric baseProbability + array phi — else silently
   ignored, not counted). `bad=1024` ⟺ `phi.length!==16`: BT options use
   `motorRepresentation:'ecology'` → 96-dim phi. The plan's G1 "length 16"
   clause matches default-shared unit states (fixture-pinned) but NOT the
   plan's own synthetic options. Script/collector defect, not instrument.
2. **Billing exact.** Ops delta 4223734−4123382 = 100352 = 1024 × (2+96).
   EXACT per-decision billing per spec.
3. **Behavior identical except honest cost.** Value delta
   −0.007378775529152 = −100352 × 5e-6/17 / 4 founders (predicted
   −0.00737882, agrees ~5e-9). Survivors, actions, weights identical
   (weights/actions pinned by fixture test 3). The G3 value-identity clause
   is unachievable alongside honest billing — plan-bar defect.
4. **No mutation.** Spent anchor digest before=after=`e0811f93…`;
   battery-internal sham-equality + checkpoint asserts held.

## Expenditure ledger (this study, cumulative)

- Attempt-01: 17 executions / 4608 ticks / 84992 founder-slots / ~2.05e8 ops.
  Program total now 6812 + 17 = **6829 worlds-equivalent executions**
  (17 probe/main executions; 0 qual, 0 dev-bank).
- Worlds: 0 new bank worlds. Bank seeds spent: 0 new (1 spent-row reuse,
  MEASUREMENT). Synthetic seeds spent: 380001–380009 (9, union-excluded).

## What V2 must correct (not in this document)

- Collector: accept ecology 96-dim phi (plan's G1 clause corrected to
  `phi.length===motorDimensions`, blocks via existing blockOf).
- Script: key direct-probe events correctly (wrap or read `'main'`).
- G3: replace value-identity with billed-cost equality
  (Δvalue = −Δops × operationEnergy / founders, tolerance 1e-6).
- Fresh synthetic seed range (380001+ spent) + a DIFFERENT spent-bank row
  (2789221780 battery already ran — never duplicate it).
- Everything else in V1 plan stands (single attempt, caps, no qual/dev bank).
