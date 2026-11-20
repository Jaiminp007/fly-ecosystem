# RSI-SELF results — Phase C GO [selection signal] (faithful eval fixes harm)

Frozen: `docs/RSI_SELF_PLAN_V1C.md`. Single authorized attempt: 12 mains
(selfmod/random/fixed × 4 histories, fresh bank 398001–398036), 0 probes.
No crashes, no resume (`redone: []`).

## Verdict: PHASE-C-GO [selection signal] (all bars pass as frozen)

- G1 integrity ✓: 12/12 mains complete; ledger exact
  (12/0/21504/516096/2.03e9); all 24 slots present with all fields.
- G2 auditability ✓: every decision rule-matches (selfmod + random).
- G3 safety ✓: gap selfmod−fixed = **−0.003 (≈ 0)**. The −0.46 harm is GONE:
  faithful-mix evaluation no longer hurts vs the fixed base.
- G4 liveness ✓: 9 adopt-slots + 24 keep-slots, 0 skips.
- G5 persistence ✓: **28 persistent adopts** spanning {rate, gain}.
- G6 selection label: selfmod−random = **+0.209 → "selection signal"**.
  Evaluated selection beats chance by 0.21 level units on 4 histories.

## What this decides

The V1b diagnosis is CONFIRMED and the fix WORKS: replacing the live-only
sandbox with the faithful live+replay mix removed the systematic harm
(−0.46 → −0.00) and revealed a real selection edge over chance (+0.21).
The agent's evaluated choices are now better than blind application of the
same menu — the first measured selection signal in the program.

Limits (pre-registered, no over-claim): selfmod ties fixed (−0.00), so the
loop finds no edge over the static base — only over chance. Four histories
is thin for the ±0.1 band; the label is the frozen interpretation, not a
robust effect size. Single-agent menu selection remains substrate, NOT RSI:
no successive revision, no copied-improvement control, no total-budget
accounting. V1a's GO and V1b's NOGO both stand (mechanism demos and the
overfitting negative are not retroactively altered).

## Instrument note (disclosed)

The as-implemented V1c scorer wrote verdict strings `PHASE-B-GO/NOGO`
(V1b copy-over). All gate booleans and numbers were computed correctly;
ONLY the phase letter was wrong. Fixed to `PHASE-C-*` post-run and the
verdict re-derived by zero-world recomputation over the frozen saved rows
(diff verified: verdict string only). Scorer fixtures updated to the
corrected strings. No rows, ledgers, or gates were touched.

## Standing maintenance rule (applied)

V1c bank fixture converted to rebuild-refusal guard post-spend (third
instance of the rule). Triage: 6 pristine failures only.

## Cumulative: 7459 + 12 = 7471 (all ledgered, zero duplicates)
