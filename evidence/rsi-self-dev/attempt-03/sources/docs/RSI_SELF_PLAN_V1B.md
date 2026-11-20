# RSI-SELF plan V1b — algorithmic menu + random-selection control (FROZEN)

Status: FROZEN 2026-10-30. Amends nothing (V1/V1A stand preserved); this is a
NEW single authorized Phase-B attempt under its own plan. No code, no bank,
no worlds yet. Further changes require V1c+.

## Why this design (read-only adjudication, zero new worlds, 2026-10-30)

From frozen artifacts: level gap candidate−unlearned ≈ **+5.0 (BT world,
m-relearn rows)** and **+5.6 (turn arena)** — learning moves level. BUT
reset≈candidate (−60.5 vs −59.7) while frozen≈unlearned: the base rule +
live updating already saturates the headroom; zeroed agents recover in
0 ticks (V1a ceiling). CONCLUSION: rate-dial tuning (V1a) is exhausted by
proof — no rate can beat a saturated rule. V1b therefore moves to
**algorithmic-variant selection**: the agent chooses among qualitatively
different learning configurations, against a **random-selection control**
that isolates whether the agent's choice beats chance. (The RSI
copied-improvement control belongs to a later search-level phase; at the
single-agent level, chance is the honest control.)

## Mechanism (generalizes V1a; V1a contract otherwise intact)

- Scheduling: check-then-step at **{256, 512, 768, 1024, 1280, 1536}** — the
  3 true phase boundaries (V1a) plus 3 mid-phase points (256/768/1280).
  Six checkpoints are REQUIRED: with 3 items each visited twice, reverts
  are possible, which makes persistence testable (with 3 checkpoints every
  adopt would trivially persist — vacuous).
- Menu (all live-update-effective, pre-registered; round-robin by checkpoint
  index 0→rate, 1→gain, 2→margin, 3→rate, 4→gain, 5→margin):
  - (a) tasteRate: intensify → current×2, attenuate → current×0.5, clip
    [0.05, 2] (V1a carryover; first-checkpoint default attenuate).
  - (b) surpriseGain: intensify → min(2.0, g×2), attenuate → g×0.5 (floor
    0.0 = off; coherent since the gain gate makes the window inert at 0).
    Base 0.5.
  - (c) margin pair: intensify → ON (marginWidth=0.1, marginBoost=1.0),
    attenuate → OFF (0,0). Base OFF. (M-GATE precedent says null — included
    deliberately: a good selector should REJECT it.)
- Direction (uniform, scale-free): testErr > prevTestErr → intensify, else
  attenuate; first checkpoint attenuates. prevTestErr is overall test error,
  item-agnostic.
- Evaluation: symmetric sandboxed fit/test on clones, adopt iff
  candErr < incErr×0.99 else keep, skip if store<16 — UNCHANGED from V1a.
  Billing UNCHANGED (flat fee 2×(fitN+testN)×(D+1); all math on clones).
  Adoption changes config only; live weights evolve through the real path.
- Arms (3): selfmod (loop as above), random (same round-robin ITEM, direction
  = coin flip from the agent's own billed live rng, applied BLINDLY without
  eval, logged with the flip), fixed (base config, no changes). ALL THREE
  arms share base {surpriseGain:0.5, surpriseWindow:16} (V1a-consistent):
  loop+menu vs blind-menu vs nothing is the ONLY arm difference, so G3
  attributes harm (or its absence) to the loop, never to the base.
- Records: selfmod {tick,item,dir,incVals,propVals,fitN,testN,errInc,errCand,
  decision}; random {tick,item,dir,flip,decision:'applied'}. Round-robin
  adherence is G2-checked (cp index → item must match for every main).

## Grid and bank

- 3 arms (selfmod/random/fixed) × 4 histories = 12 mains, 0 probes.
- Fresh dev bank `evidence/rsi-self-dev/fresh-02/`: 4 histories × 9 slots =
  36 seeds, range **397001–397036**. VERIFIED clean 2026-10-30: zero exact
  tokens across tests/scripts/docs/learning/evidence (loose-397 hits are
  old-file float/seed substrings, same class as the cleared 3960xx case).
  Spend 12 mains (3 arms × 4 main-seeds); other 24 slots reserved-excluded,
  never spendable elsewhere. fresh-01 (V1a) untouched.
- Caps: ≤300 exec (12 used), ≤20e9 ops, ≤3600s wall. Single attempt; crash-
  resume only with dual provenance; no second attempt under V1b.

## GO bars (conjunctive, fail-closed)

- G1 integrity: 12/12 mains complete; ledger exact; `redone` empty; all 24
  expected checkpoint-slots (4 mains × 6) present with n>0 and all fields.
- G2 auditability: every selfmod decision == rule recomputation (item order,
  direction, adopt-threshold, skip shape); every random record shows
  decision 'applied' with logged flip and null eval fields; round-robin
  adherence exact. Zero new worlds. Else INVALID.
- G3 safety: mean(selfmod level) − mean(fixed level) ≥ −0.15. Else NO-GO.
- G4 liveness: ≥2 ADOPT-checkpoint-slots and ≥2 KEEP-slots of 24; ≤4 fully-
  skipped slots. Else INCOMPLETE.
- G5 persistence (the accepts measure): ≥8 agent-adopts still in effect at
  run end (no later revert of the same tunable), spanning ≥2 distinct menu
  items with ≥1 persistent adopt each. Else NO-GO ("adopts do not stick").
- G6 selection interpretation (MANDATED descriptive, always reported):
  D = mean(selfmod) − mean(random): D>+0.1 "selection signal — V1c may
  pursue menu-selection"; |D|≤0.1 "no selection signal — V1c needs a new
  menu or substrate"; D<−0.1 "selection harmful — close line". Shapes the
  verdict's license but does not gate it (4-history level noise must not
  coin-flip the verdict).
- G7 fixtures (gate before bank): 7 green — choice order + per-item
  direction mapping; sandbox executes gain/margin variants with exact
  billing; random arm applies blindly with logged flips and no eval;
  scorer V1b branches (GO/NOGO/INVALID/INCOMPLETE + labels);
  bank + union-exclusion; hook bit-identity re-verified (instrument
  changed); full triage clean.
- Verdict GO ⟺ G1∧G2∧G3∧G4∧G5, reported WITH the G6 label. GO licenses
  PROPOSING V1c (fresh plan + fresh bank + fresh goal), never executing
  one here. No RSI claim under any outcome: single-agent menu selection is
  substrate, not recursive self-improvement.
