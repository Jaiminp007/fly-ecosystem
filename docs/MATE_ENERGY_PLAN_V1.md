# MATE-ENERGY plan V1 — energy bar 65 vs 50 (FROZEN)

Status: FROZEN 2026-10-26 (date: 2026-10-30). Single authorized Phase-A
attempt under its own plan. MATE-ACT / MATE-DENSE stand. No code, no bank,
no worlds yet. Further changes require V1a+.

## Why this line (direct prescription of the density NOGO)

MATE-DENSE proved crowding backfires (fixed food ÷ more mouths → everyone
poorer → fewer above the bar). The two levers work against each other, so
the causally-next move is the OTHER side of the joint requirement: LOWER
THE BAR. Pre-registered reasoning: (1) V1 encountered zero qualified
co-locations with bar=65 despite maxE 71.5 observed — the bar binds at the
top of the feasible range; (2) founders spawn AT 65 but mature at 18–28
ticks, by which time metabolism has burned them below bar — the spawn is
anti-qualified by construction; (3) bar=50 sits BELOW spawn energy, so
founders are qualified-from-(near)-birth (modulo maturity), directly
undoing the anti-qualification; (4) with N=24 both arms (no competition
confound), the ONLY difference is the bar — perfect ablation of the
energy-gating hypothesis.

## Design (minimal delta)

- 2 arms (bar65 control / bar50 test) × 4 histories = 8 mains, 0 probes.
  Both arms: reproduction:true, matingActionRequired:false (proven gate
  removal), N=24, BT base otherwise. The ONLY difference is the energy
  threshold.
- New engine knob `matingEnergyBar` (default 65 = current behavior exactly),
  replacing the two hardcoded `65` comparisons in the mating loop;
  plumbed from TasteExperiment constructor (default 65); validated as
  finite positive in validateConfig; `??= 65` in World.restore. No intact
  arm (structural impossibility is proven code, not an empirical claim
  needing re-verification per bank).
- Fresh dev bank `evidence/mate-energy-dev/fresh-01/`: 4 histories ×
  9 slots = 36 seeds, range **404001–404036**. VERIFIED clean 2026-10-30
  (zero exact tokens repo-wide). Spend 8 mains (2 arms × 4 main-seeds);
  other 28 slots reserved-excluded, never spendable elsewhere.
- Caps: ≤300 exec (8 used), ≤20e9 ops, ≤3600s wall. Single attempt;
  crash-resume only with dual provenance; no second attempt under V1.

## GO bars (conjunctive, fail-closed; mechanism demo only)

- G1 integrity: 8/8 mains complete; ledger exact (8/0/14336/344064); `redone`
  empty; endpoints carry survivors + totals.
- G2 audit: per-row bar value matches arm (65/50); all birth counts
  integer ≥ 0; flag false everywhere.
- G3 outcome: bar50 total ≥1 → GO ("energy bar was binding; unlock
  demonstrated — arm split recorded: bar65-only births would mean bank
  luck, not density"). Both zero → NOGO ("proximity itself binds even
  for qualified pairs → attractant/directed-movement lines, not lower
  bars"). No INVALID branch beyond G1/G2 (no premise can break — both
  arms share proven gate removal; either arm birthing is informative).
- G4 descriptive (no gate): per-arm levels, survivors, birth contexts
  (tick/parents/generation where applicable). Co-location rates are NOT
  measurable from frozen rows (no positions saved) — no claim attempted.
- G5 fixtures (gate): 4 automated + triage — (1) scorer GO/NOGO/INVALID
  branches; (2) bank + union-exclusion; (3) bar knob (default 65
  behavior-identical short run; explicit 50 accepted + threaded through);
  (4) null-behavior (flag+bar defaults reproduce a frozen digest on a
  fixture history — guards the engine edit); (5) full triage clean.
- Verdict GO ⟺ G1∧G2∧G3. No population claim (a birth ≠ lineage), no
  learning claim, no RSI claim. GO licenses proposing inheritance (parental
  weights ± mutation) and/or courtship — fresh plans, never executing here.
