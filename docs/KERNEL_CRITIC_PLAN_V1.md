# KERNEL-CRITIC PLAN V1 (Track-K1) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: `docs/EMBODIED_KERNEL_FEASIBILITY_V1.md` (infeasible-as-port →
new track) + `docs/EMBODIED_KERNEL_SCOPING_V1.md` candidate A (sat
several turns; no counter-evidence). New rationale: the RSI paragraph's
only untested-but-feasible gap is embodied benefit — this line tests it
directly with the ACCEPTED RBF-gradient revision embodied as a critic.

## Question

Does a kernel-critic hybrid (actor tick-AC-exact, critic = RBF-gradient
kernel prediction of return, trained on the fly's own TD-errors) improve
embodied action quality vs the tick-AC baseline on a fresh bank?

## Design (new module, baseline untouched)

- New file `learning/tick-kernel-critic.mjs` (imports kernel-learner +
  tick-AC actor parts; engine imports it ONLY when the new flag selects
  it — default off ≡ current behavior exactly; golden tests unaffected).
- Kernel program: {kernel:'rbf',update:'gradient'} (THE accepted revision —
  reuse, not reinvention). Capacity 256 evict-oldest (accepted value).
  Projection: 33 tick features → 20 kernel dims via FIXED random matrix
  (seed-pinned in the plan appendix at implementation; |v|≤1 enforced by
  clamp; projection + clamp billed). Update: every tick on the fly's own
  TD-error (target = return estimate; kernel `updateKernel` verbatim).
- Transplant rule (V1b precedent): coefficients carried (model, like
  weights); records CLEARED (experience, like replay buffers — refill
  from the test world).
- Null-default: flag default off; off-path = current code paths only
  (sources-closure fixture proves no new imports on the default path).

## Arms (matched histories, 12 mains)

Per history (6 fresh histories): baseline (tick-AC, flag off) + critic
(kernel-critic, flag on), same history seed, 1792 ticks, N=24.
6×2 = 12 mains, 0 probes. Same bank, same ticks, same founders —
the ONLY difference is the critic (single-knob discipline).

## Gates (conjunctive, fail-closed)

- G1 join ≥0.99 all rows + transplant-integrity where applicable.
- G0 baseline sanity: baseline mean turn-gap ≥0.5 (the baseline learns;
  else INCOMPLETE-BASELINE (mechanism untested, not failed)).
- **G2a-PRIMARY (embodied superiority)**: kernel-critic pooled mean
  turn-gap − baseline pooled mean ≥ +0.1 (program yardstick). Fail (G0
  intact) → NOGO (no embodied benefit).
- G2b no-collapse: kernel-critic same-val ≥0.5 + survivors ≥ baseline
  survivors − 25% (not trading lives for gaps; descriptive energy).
- G2c null-hygiene: fixture-proven default-path identity (no new imports
  off-flag) + one budgeted null main? NO — 12 mains fixed; null-hygiene
  is fixture-level (construction identity) + sources-closure. (Deviates
  from live-null-arm precedent deliberately: the baseline module is
  untouched, so there is no live path to contaminate; fixtures prove it.)
- GO-V1 ⟺ G1 ∧ G0 ∧ G2a ∧ G2b ∧ G2c. INCOMPLETE-BASELINE on G0 fail;
  INVALID on integrity/config/budget fail.
- DESCRIPTIVE: per-tick ops, energy endpoints, record counts, projection
  saturation (% clamped), HB-split (does the critic help unlearning?).

## Fixtures (12, gate before bank — includes a budget fuse)

Kernel program validation; projection unit (|v|≤1, deterministic,
billed); critic construction (kind/flag wiring); null-identity
(default path = current imports); transplant carry/clear unit;
per-tick ops bound (assert ≤ per-tick budget or plan INVALID here —
fail-closed BEFORE any bank); scorer superiority/no-benefit/
collapse/INVALID/INCOMPLETE branches; bank-build tmpdir form.

## Bank, caps, attempt discipline

- Fresh-01 bank `evidence/kernel-critic-dev/fresh-01/`: 6 histories × 9 =
  54 seeds, range **451001–451054**. VERIFIED clean 2026-11-02 (zero
  exact-seed/registry/test hits across docs/scripts/tests/learning/engine
  pre-freeze). attempt-01 + fresh-01 verified free pre-freeze. Builder
  re-verifies at build; fixture-seeds file after build; post-bank refusal;
  union-excluded (spent through 450xxx + own 451001–451054 appended).
- Caps: 12 mains / 0 probes / 21504 worldTicks / 516096 founderSlots /
  8.0e9 scalar ops (kernel updates cost ~30× tick-AC per tick; 1.5× linear
  estimate) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance; any other
  deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline (record both; ENOSPC
  environmental failures pre-existing — record, don't fix here).

## What GO/NOGO mean

- GO: embodied benefit DEMONSTRATED (first RSI-paragraph gap closed).
  Does NOT complete RSI (search productivity FAILED; revisions lack
  recursive advantage — stated in the same verdict).
- NOGO: kernel-critic confers no embodied benefit (mechanism fails at
  the action-selection level; forecasting ≠ control confirmed
  behaviorally). Either verdict narrows the open core honestly.
