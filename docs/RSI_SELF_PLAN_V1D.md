# RSI-SELF plan V1d — replication (8 histories) + copied-search control (FROZEN)

Status: FROZEN 2026-10-30. New single authorized Phase-D attempt under its
own plan. V1/V1A/V1B/V1C stand preserved. No code, no bank, no worlds yet.
Further changes require V1e+.

## Why this design

V1c's selection signal (+0.21, selfmod > random) rests on 4 histories —
thin for a ±0.1 band. And the RSI requirements demand a copied-improvement
control: does the agent's SEARCH beat free-riding on its outputs? V1d firms
the signal (8 histories) and adds the copy control (per-agent lagged mirror)
while changing NOTHING else — same menu, checkpoints, faithful-mix eval,
fee, shared base. Clean extension, not a new idea.

## Copied protocol (frozen)

At each checkpoint, each copied agent applies the adopted config of the
SAME agentId in the selfmod arm of the SAME history from the PREVIOUS
checkpoint (cp_0: no source → no change). If the mirror adopted nothing at
the source checkpoint, or either agent is dead, the copied agent keeps its
current config (logged as no-change). Blind application, no evaluation,
no fee beyond the runner's own stepping. Logged per record:
{decision:'copied', sourceCp, values, flip:n/a, eval fields null}.
Rationale: copied free-rides on selfmod's discoveries with one checkpoint
of lag; selfmod-vs-copied therefore isolates TIMING + the eval's role in
REJECTING bad options (random applies everything blindly; copied only ever
sees selfmod-accepted configs). Expected ≈ 0 if timing hardly matters —
informative either way, hence DESCRIPTIVE (G6b), never gating.

## Grid and bank

- 4 arms (selfmod/random/fixed/copied) × 8 histories = 32 mains, 0 probes.
  6 checkpoints {256…1536}, 3-item round-robin menu, faithful-mix sandbox,
  flat fee, shared base {surpriseGain:0.5, surpriseWindow:16} on ALL arms.
- Fresh dev bank `evidence/rsi-self-dev/fresh-04/`: 8 histories × 9 slots =
  72 seeds, range **400001–400072**. VERIFIED clean 2026-10-30 (zero exact
  tokens repo-wide). Spend 32 mains (4 arms × 8 main-seeds); other 40 slots
  reserved-excluded, never spendable elsewhere. fresh-01/02/03 untouched.
- Caps: ≤300 exec (32 used), ≤20e9 ops (est ~5.5e9 from V1c scaling),
  ≤3600s wall (V1c ran 12 mains in 58s; est ~3 min). Single attempt;
  crash-resume only with dual provenance; no second attempt under V1d.

## Bars

- G1 integrity: 32/32 mains complete; ledger exact; `redone` empty; all 48
  selfmod checkpoint-slots (8 mains × 6) present with n>0 and all fields.
- G2 auditability: selfmod rules (item order, direction, threshold, skip
  shape) + random shape (blind, flip logged, eval nulls) as V1c, PLUS copied
  cross-arm rule: every copied record's values == the mirror agent's adopted
  values at sourceCp in the same-history selfmod row (or current config if
  the mirror adopted nothing / either side dead; cp_0 always no-change);
  item round-robin exact. Zero new worlds. Else INVALID.
- G3 safety: mean(selfmod) − mean(fixed) ≥ −0.15. Else NO-GO.
- G4 liveness: ≥2 adopt-slots and ≥2 keep-slots of 48; ≤8 fully-skipped.
  Else INCOMPLETE.
- G5 persistence: ≥16 persistent agent-adopts (2× V1c bar for 2× mains)
  spanning ≥2 distinct menu items. Else NO-GO ("accepts do not stick").
- G6a replication (GATING): mean(selfmod) − mean(random) > +0.1 on 8
  histories. The pre-registered firm-up of V1c's +0.21. Else NO-GO
  ("signal did not replicate — treat V1c as 4-history noise").
- G6b copied table (MANDATED descriptive): selfmod−copied and
  copied−fixed with ±0.1 bands; interpretation recorded (timing matters /
  configs are all that matters / copying beats searching — the last would
  close the search line). Shapes V1e, never gates.
- G7 fixtures (gate): 7 — choice/direction/mix-fee (carried); copied
  protocol unit (lag, cp_0 no-op, dead-mirror no-op, value-match);
  cross-arm G2 on synthetic rows; scorer V1d branches (GO/NOGO/INVALID/
  INCOMPLETE + G6a/G6b); bank + union-exclusion; hook bit-identity
  re-verified; full triage clean.
- Verdict GO ⟺ G1∧G2∧G3∧G4∧G5∧G6a + G6b table. No RSI claim under any
  outcome: single-run selection, however replicated, is not successive
  revision. GO licenses PROPOSING V1e (run N's adopted config seeds run
  N+1 — the actual successive-revision test), never executing one here.
