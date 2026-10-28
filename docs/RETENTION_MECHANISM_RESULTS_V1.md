# Retention-mechanism study — results V1 (R1 reinstatement)

Frozen 2026-10-28. Status: COMPLETE (audited, single authorized attempt).
Verdict: **SUPPORT-H1-motor (audited, with estimand reinterpretation)**.

## Provenance

- Plan: `docs/RETENTION_MECHANISM_PLAN_V1.md` (frozen; two pre-execution
corrections recorded in-plan with reasons: +8 atA-baseline probes = 100 total;
tolerance identity after runtime-drift diagnosis).
- Sources frozen at execution: plan `e3ddab78…`, `scripts/reinstate-probes.mjs`
`e4b6d827…`, `tests/reinstate-probes.test.mjs` 4/4 green,
`taste-energy.mjs e389a1c1…` (unchanged since V3), `taste-experiment.mjs
1d88b5d5…`, `taste-pressure.mjs a1604a8e…`.
- Inputs (read-only): V2 bank `47b44c62…`, `attempt-01/anchors/N/*-{A,C}.json`,
`attempt-01/rows/*.json`. Attempt: `evidence/retention-mechanism/v1/attempt-01/`
(rows × 8, ledger, scored.json).
- Expenditure: 100 probes (8 hist × (4 atA-baseline + 4 taste + 4 motor) + 4
identity), 25,600 world-ticks, 614,400 founder-slots, ops ≈ 3.4e9 ESTIMATED
(V2 mean 3.39e7/probe; per-probe counters not recorded — labeled estimate).
0 mains, 0 seeds spent, 0 bank contact beyond reads. Cumulative program total:
5128 + 440 + 688 + 228 + 100.

## Identity / integrity (all pass)

- Sham deep-equality held on all 100 probe calls (same-process determinism).
- Identity history (2789221780, first in bank order): unmodified atC clone
reproduces filed battery — identical survivors (15/15/11) + identical billed
ops (170,497,603) on all A-probes; |Δvalue| ≤ 9e-5 (tolerance 1e-3).
Diagnosis: same op counts + same survivors ⇒ identical decision trajectories;
the ≈7e-5 uniform shift (all 12 battery probes on full rerun) is world-energy
math drift from a Node Math patch change between the V2 run and now, not
instrument corruption. All R1 conditions ran in-process under one runtime, so
contrasts are unaffected; baselines carry a ~1e-4 documented offset, 3+ orders
below decision thresholds.
- atA-baseline reproduction: current/reset survivors identical, |Δ| ≤ 1e-3.
- Scorer analytic check: recombined aRet_C reproduces V2 rows to <1e-9.

## Per-history results (N-body; retention combination units)

| seed | aRet_A | aRet_C | aRet_T | aRet_M | |T−C| | |M−A| vs |C−A| |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2789221780 | 0.189 | 0.395 | 0.395 | 0.128 | 8e-7 | 0.061 vs 0.206 |
| 3101318742 | 0.272 | −0.066 | −0.066 | 0.095 | 4e-7 | 0.177 vs 0.338 |
| 604620731 | 0.180 | 0.705 | 0.705 | 0.083 | 6e-7 | 0.096 vs 0.526 |
| 1819120700 | 0.109 | 0.226 | 0.226 | 0.050 | 4e-6 | 0.059 vs 0.117 |
| 3457244208 | 0.211 | 1.201 | 1.201 | 0.042 | 4e-6 | 0.170 vs 0.989 |
| 1699080847 | 0.203 | −0.224 | −0.224 | 0.097 | 5e-6 | 0.106 vs 0.427 |
| 2462423342 | 0.292 | 1.173 | 1.173 | 0.073 | 7e-7 | 0.219 vs 0.881 |
| 3749351049 | 0.120 | 0.472 | 0.472 | 0.129 | 7e-6 | 0.010 vs 0.353 |

Frozen rule: mean fMotor = 1.075 ≥ 0.50, mean fTaste = 0.00 ≤ 0.25,
gap ≥ 0.30, motor wins 8/8 ≥ 6/8, nFrac 8/8 → **rule fires SUPPORT-H1-motor**.
Severe guard: 0/8 histories with aRet_C < −0.50 (no severe line to drive the
mean). Average, consistency (8/8), severe (0/8) reported separately as required.

## Audit reinterpretation (why the rule firing needs a footnote)

1. **Fraction formulation is misspecified.** The plan assumed monotone A→C
decay; the data show aRet_C > aRet_A in 6/8 histories (the combination is a
within-checkpoint contrast, not a level — at atA, current ≈ acquisition so
aRet_A ≈ +0.1..+0.3 small). Fractions with negative denominators are
directionally incoherent (fMotor > 1 = overshoot below A). The rule's
numerical firing is preserved verbatim above; the evidential weight rests on
the absolute analysis instead.
2. **Absolute analysis (audit primary):** |aRet_T − aRet_C| ~ 1e-6 in all 8
histories (drift noise; taste reinstatement moves nothing) vs motor
reinstatement bringing retention to near-atA levels in 7/8 (|M−A| ≪ |C−A|;
best 0.010 vs 0.353). Substance: **probe-time retention variation is
motor-determined; the taste subsystem is causally inert at probe time.**
3. **Mechanism (saturation):** code path audit (`chooseTasteEnergyAction`)
shows taste enters probe behavior only via greedy accept (threshold .5) and
block-1/2 routing. Readout margins are +3.4..+4.0 everywhere (E4) ⇒
prediction saturates near 1 under BOTH atA and atC weights ⇒ identical accept
+ identical routing ⇒ swapped taste weights cannot move behavior. This
explains V3's failure from the other side: the anchor moved logits inside
the saturated region (no effect) except near-threshold flips (harmful).
4. R0 (descriptive, confounded): early-A:current ≈ −8.2..−9.1 (24/24 alive)
vs battery A:current ≈ −3.4..−6.1 (8–15 alive) — level and survival both
fall atC; survivor mismatch prevents causal reading (recorded, not corrected).
5. R2 (descriptive): taste-clone margins ≈ atA margins (alive-set differences
only: atC has 18 alive vs atA 24); motor-clone margins = atC margins —
readout untouched by motor swap, as constructed.

## Decision (per plan mapping)

**SUPPORT-H1-motor → recommend a MOTOR-side intervention line under a
separately frozen plan** (e.g., slow-anchor on the actor readout or
progress-rule augmentation — the stage that actually decides retention),
with directional taste protection staying CLOSED. Taste-side reopen requires
off-codebook cue analysis (why saturation holds / where thresholds sit).
H2 (constant-shift vs reordering) needs a fresh-bank follow-up — NOT launched
here; no second run under this plan. If the motor line fails, the plan's
ELSEWHERE branch (observational-disambiguation sensing) is next.
No PASS/RSI claim of any kind attaches to this measurement study (spent-bank
reuse, predeclared non-qualifying).
