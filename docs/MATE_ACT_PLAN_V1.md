# MATE-ACT plan V1 — Avida-decoupled mating gate (FROZEN)

Status: FROZEN 2026-10-30. Single authorized Phase-A attempt under its own
plan. No code, no bank, no worlds yet. Further changes require V1a+.

## Why this design, in this order

MATING-DIAG proved the block structural (channel 3 = −1 always). Three
candidate fixes exist: (A) overload action-3 with mating intent (confounds
pause-turn behavior program-wide); (B) Avida-decoupled — drop the
deliberate-act clause, mate on proximity+energy+age+cooldown (1-line,
zero behavioral confound); (C) courtship protocol via signal channel 4
(agency-preserving, most machinery). The outside-box round surfaced C, but
C ASSUMES opportunity (pairs co-locate qualified) while B TESTS it: if
pairs never co-locate, no courtship protocol can work and C fails
ambiguously, whereas B's failure is diagnostic (energy proven present →
proximity must be absent). B is therefore the prerequisite, C the
follow-up. This plan freezes B; GO licenses PROPOSING C (never executing).

## Mechanism (single ablation)

Engine reproduction loop (`engine.mjs`): the female skip-clause
`...||actions.get(f.id)[3]<=0` and the mate condition
`...&&actions.get(m.id)[3]>0` are each gated on a new World config flag
`matingActionRequired` (default `true` = current behavior exactly):
```
const needAct=this.config.matingActionRequired??true;
...||(needAct&&actions.get(f.id)[3]<=0)... // female skip
...find(m=>...&&(needAct?actions.get(m.id)[3]>0:true)) // mate choice
```
Plumbing: `TasteExperiment` constructor gains `matingActionRequired=true`
default, passed into World config; World defaults the flag true (so every
existing direct construction is behavior-identical); any config validation
is extended, not bypassed. Decoupled arm sets the flag false (+
`reproduction:true`); intact arm leaves the default (+ `reproduction:true`).
All other conditions (sexes, energy≥65, age≥maturity, cooldown≤0, radius
26, capacity 240) UNCHANGED. Learner config identical across arms (BT
candidate base): the flag is the ONLY arm difference.

## Grid and bank

- 2 arms (decoupled/intact) × 4 histories = 8 mains, 0 probes. Standard
  BT mains (1792 ticks); learner = candidate (best survivor in M-POP:
  17 vs 10 vs 3 — the question is actuation, not learning).
- Fresh dev bank `evidence/mate-act-dev/fresh-01/`: 4 histories × 9 slots
  = 36 seeds, range **401001–401036**. VERIFIED clean 2026-10-30
  (zero exact tokens repo-wide; the loose-40xx hits are float/seed
  substrings in old files, same cleared class). Spend 8 mains (2 arms ×
  4 main-seeds); other 28 slots reserved-excluded, never spendable elsewhere.
- Caps: ≤300 exec (8 used), ≤20e9 ops, ≤3600s wall. Single attempt;
  crash-resume only with dual provenance; no second attempt under V1.

## GO bars (conjunctive, fail-closed; mechanism demo only)

- G1 integrity: 8/8 mains complete; ledger exact
  (8/0/14336/344064 ticks/slots); `redone` empty; endpoints carry
  survivors + birth totals.
- G2 accounting: `run.world.totals.births` integer ≥0 on every main; birth
  records (if any) carry parentIds + generation; standard conservation
  (`|residual|<1e-7`) + op caps hold.
- G3 existence (THE bar): decoupled-arm births ≥1 total across 4 mains
  AND intact-arm births == 0 → GO (structural block removed, opportunity
  exists). Decoupled 0 → NO-GO (opportunity lack: qualified pairs never
  co-locate — redirects to density/ecology, not actuation). Intact >0 →
  INVALID (diagnostic premise broken: channel 3 fires somewhere — stop,
  re-diagnose; no verdict on the mechanism).
- G4: no additional arm-level harm bar (level is descriptive here; mating
  costs energy by design — 24 per parent — so level gaps are expected, not
  gated). Records mean levels per arm for the follow-up's baseline.
- G5 fixtures (gate before bank): 5 — (1) flag default-true + short-run
  null-behavior (flag-false ≡ flag-true bit-identical where no mating is
  possible); (2) bank build + union-exclusion; (3) scorer GO/NOGO/INVALID
  branches; (4) birth-totals cross-check helper; (5) full triage clean
  (6 known shifted-pristine failures only).
- Verdict GO ⟺ G1∧G2∧G3(GO-branch) (G3 decides GO vs NO-GO; INVALID on
  premise break). No population claim (a birth ≠ viable lineage), no
  learning claim, no RSI claim. GO licenses PROPOSING the courtship
  follow-up (Option C) and/or a viability line — fresh plan + fresh bank,
  never executing here.
