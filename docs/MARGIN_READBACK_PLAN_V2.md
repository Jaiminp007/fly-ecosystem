# Margin-readback repair plan V2 (D1-FIX correction)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized attempt only. V1 (`docs/MARGIN_READBACK_PLAN_V1.md`,
verdict NO-GO per its bars in `docs/MARGIN_READBACK_RESULTS_V1.md`) is
preserved untouched — this is a NEW frozen attempt, not a rescore or a
second run under V1. No second attempt under V2 either.

## Why V2 (frozen basis, no re-litigation)

Attempt-01's ledgered artifacts proved the instrument spec-exact (1024/1024
decisions emitted; billing 100352 = 1024×(2+96) EXACT; Δvalue = billed-energy
cost to ~5e-9; spent anchor digest unchanged). All three bar failures trace
to script/collector defects and internally inconsistent bar clauses:

- V1-D1: script read `perProbe['A:current']` but direct `runTasteProbe` calls
  emit raw events (battery-only wrapping gives probe keys).
- V1-D2: collector hardcoded `phi.length!==16`; the frozen synthetic options
  (`BT_LEARNER_OPTIONS`, `motorRepresentation:'ecology'`) produce 96-dim phi.
- V1-D3: G3 demanded value-identity alongside honest billing, which bills
  energy — unachievable by construction.

## Deltas from V1 (everything else inherited unchanged)

1. Seeds: fresh synthetic range 380011–380019 (380001–380009 spent in V1),
   ledgered in `evidence/margin-readback/fixture-seeds-02.json` BEFORE use.
   Spent-bank row: bank-order-second V2 history **3101318742** (atC anchor:
   24 learners, 15 alive, ecology 96-dim — verified read-only). The 2789221780
   battery already ran in V1 and is NEVER duplicated.
2. Collector (`collectMarginReadback`): dims-aware. Accept phi arrays of any
   length; require uniform length across a probe set AND equal to the anchor's
   `motorDimensions` (96 for both synthetic and spent anchors); keep the
   finite-baseProbability∈[0,1] + boolean-cruise gates; blocks via `blockOf`.
3. Script: wrap direct-probe emits with probe keys
   (`e=>col.emit({probe:'A:current',event:e})`) so G-bars read probe keys
   under the same convention as the battery.
4. G1 (corrected): `A:current` n>0, bad=0, uniform phi length = 96, all
   baseProbability finite ∈[0,1], cruise boolean.
5. G2 (unchanged): `A:reset` emits 0 margin events.
6. G3 (corrected): survivors equal AND ops strictly greater AND billed-cost
   equality `|Δvalue + Δops×operationEnergy/founders| ≤ 1e-6`
   (`operationEnergy=BT_PRICING.operationEnergy`, founders=4). V1 observed
   ~5e-9; 1e-6 still catches any behavioral divergence (one action flip moves
   value ~0.01+).
7. G4 (unchanged in content): 5 battery keys n>0 bad=0, anchor digest
   unchanged, battery-internal asserts hold.
8. G5 (unchanged): full `npm test` shows no NEW failures vs stashed-pristine
   baseline (V1 baseline file `/tmp` is ephemeral — re-triage if needed);
   fixture tests (below) pass 100% before execution.
9. Output: `evidence/margin-readback/attempt-02/`. Same caps as V1
   (≤32 exec, ≤100k ticks, ≤1M founder-slots, ≤1e9 ops, ≤100MB, ≤1800s wall).
10. Instrument files UNCHANGED: `learning/taste-energy.mjs`,
    `learning/taste-experiment.mjs` (V1 implementation stands; hashes
    re-recorded in `attempt.json`). Changed: `scripts/margin-readback-check.mjs`
    (collector + keys + G3), `tests/margin-readback.test.mjs` (+96-dim
    collector case, +wrap-key case — must pass before execution).

## Not included (unchanged)

No dev bank, no qual bank, no learner revision, no intervention effect, no H2,
no ELSEWHERE sensing, no RSI, no Option B, no rescoring of attempt-01, no
duplicate of the 2789221780 battery, no second V2 run. On NO-GO: D1-FIX
closes, D1 remains the documented blocker. On GO: the repair is ACCEPTED and
a margin-gated follow-up may be PROPOSED under its own frozen plan — no
worlds for it here.
