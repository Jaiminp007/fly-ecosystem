# RSI C13 PLAN V1 (two-fire iterative revision: adopt, learn, re-fire) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: TWO_FIRE_SCOPING_V1
(all 4 open questions resolved below) + C-series closure (C13 needs a
genuinely new rationale — iterative within-run revision is structural,
not another operator). First line that lets the loop OBSERVE ITS OWN
EFFECTS and revise again: second-order internal revision.

## Resolved scoping questions (zero worlds, analytic)

1. Records at 512: ~11k decisions by tick 512 (extrapolated from
   ~40k/1792-tick C-rows) — temporal split yields ~5.5k fit/test
   each, 3 orders above MIN. Fail-closed skip already in the fire
   path covers shortfalls. RESOLVED.
2. Billing: 2 flat fees/agent ≈ 1.6k ops vs 3.3e9 totals —
   negligible. RESOLVED.
3. Transplant identity: adoptions are config; transplant copies
   weights only — unchanged from C4–C12. RESOLVED.
4. Gate shape: G2a double-vs-static successive; G2b double-vs-single
   (does the second fire add value?). Copier retired (C10 pattern:
   no blind arm when both arms evaluate). RESOLVED.

## Design (seg-chain, 2 chains × 10 runs = 20 mains, 0 probes)

Per chain (H0/H1/H2), same-arm exact transplant, proposal ticks
{512, 1024} for double / {1024} for single, lifetime 2 fire events
(single-op each: 2 evals ≤ OL_LIFETIME_MAX=4), temporal sandbox
split, 20 mains, flip-split HB scorer, G0/G1/G2a/G2c/G2d, verdicts
C13-*.
- Menu (frozen, single-op): **6 (surprise-gated gain)** — the only
  transfer-positive operator (if iterative revision works anywhere,
  it's here); second fire re-evaluates on post-adoption experience.
- `double-*`: fire menu 6 @512 (adopt iff pass) → learn 512→1024
  under adopted-or-baseline config → fire menu 6 @1024 again
  (adopt iff pass). Per-agent second decision conditioned on first.
- `single-*` (C6-verbatim looper): fire menu 6 @1024 only.
- `static-*` + `unlearned` as in C4–C12.
- **G2a**: double-T1 HB − static-T1 HB ≥ +0.1 AND double-T2 HB −
  static-T2 HB ≥ +0.1 AND double-T2 ≥ double-T1.
- **G2b (second-fire value)**: pooled double HB − pooled single
  HB > 0.

## Loop + experiment change (null-default additions)

`rsi-operator-loop.mjs`: no new eval function (reuse
`fireLooperProposal` per fire; the routine is stateless across
fires — proposals accumulate in rsiLoop.log, lifetime counts
2 events ≤ 4). `taste-experiment.mjs`: arm `'double'` +
`OL_PROPOSAL_TICK_EARLY=512`; fire line extends (double fires at
512 AND 1024; looper/single fire at 1024 only). All other arms
byte-identical.

## Fixtures (17), bank, caps, attempt discipline

- C6/C12-adapted (menu-6 assertions; transplant integrity; scorer;
  bank; caps; dose... n/a (no copier)) + two-fire fixtures:
  double fires twice (2 proposal records, ticks 512+1024 asserted
  via fire-helper on synthetic states); single fires once; early
  fire skips on insufficient records (fail-closed); second fire
  sees post-first-adoption config (synthetic: adopt-then-refire
  changes the sandbox input — the second-order property itself).
- Fresh-29 bank `evidence/rsi-c13-dev/fresh-29/`, 9-schema, 6×9,
  range **467001–467054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-29 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 466xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.

## What GO/NOGO mean

- GO: iterative revision lifts real transfer (≥2 successive +
  second-fire value) → RSI CLAIM (first ever if met; bars unmoved).
- NOGO (G2b flat/negative, both adopt): the second fire adds nothing
  (first adoption already optimal OR barren — compare adoption
  counts; loop is one-shot, not iterative).
- NOGO (G2b flat/negative, double adopts less): second fire HURTS
  (post-adoption experience misleads the sandbox — evaluation is
  non-stationary; deepest C-series finding if so).
- NOGO (G2a fails): choice doesn't lift on this bank.
