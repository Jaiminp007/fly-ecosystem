# RSI C2 RESULTS V1 — C2-NOGO (capability demonstrated, product absent)

Date: 2026-11-02. Attempt-01 (single authorized, fresh run after pre-verdict
replayGain-key repair; debris preserved at
`evidence/rsi-c2-dev/attempt-01-debris-replayGain-key/`): 20/0/35840/860160/
3.329e9, `redone: []`, caps respected (4.0e9/10800s). Bank fresh-18
(456001–456054) SPENT.

## Verdict: C2-NOGO (loop runs correctly; adopted operators don't transfer)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 looper-train ≥0.5 | TRUE |
| G2a-PRIMARY successive lifts | FALSE (lift1 −0.006, lift2 +0.000; need +0.1 ×2 + non-decrease) |
| G2b looper − copied > 0 | TRUE (+0.0002 — technically true, magnitude zero) |
| G2c unlearned flat | TRUE |
| G2d same floor ≥0.5 | TRUE (0.91) |

## What the loop did (capability: YES)

- Proposals fired at tick 1024 on all looper runs (24/24 agents evaluated).
- Sandbox evaluated per-agent (fit/test split, billed fee) and adopted:
  train 4/48 agents (op0 = gain 0.5), T1 13/48 (op1 = gain 1.0).
- Majority vote carried ops across runs (chain ran op0 then op1 as designed).
- Checkpoint byte-identity held (live untouched by sandbox); lifetime caps
  held; no crashes, no integrity violations across 20 mains.
- The internal loop RUNS bounded, checkpointed, and honest — the C1
  capability claim is now live-validated, not just fixture-validated.

## Why no product (mechanism, not failure-to-run)

- Adopted plain gains do not improve transfer HB (0.949 vs 0.955 static;
  identical to copied). This CONFIRMS the replay synthesis (V1): uniform
  amplification is saturated; SELECTION is what matters (surprise +0.13
  vs plain/threat/damage ≈ 0). The loop correctly adopted amplification
  and amplification correctly did nothing — the OPERATOR SPACE (menu 0–1)
  is empty, not the loop broken.
- Sandbox→transfer proxy: sandbox improvements (train error) did not
  predict transfer (HB). Proxy failure bounds the result (adoptions were
  real sandbox wins that didn't travel).
- BOUNDED NOGO: menu indices 2–5 (gain 2.0, skips, shrink — including
  SELECTION operators) were never proposed (role-assigned 0,1 only).
  A loop trying selection is untested, not falsified (concrete C3
  direction, not a vague hope; needs its own frozen plan + fresh bank).

## Standing

- No RSI claim (bars unmoved and unmet: 0 successive lifts, productivity
  +0.0002). The C2 execution is the first live test of internal
  proposal-evaluation-adoption, and it returns the M3-shaped verdict at
  the agent level: capability demonstrated, product withheld.
- Line CLOSED (single attempt spent). Cumulative 8171 (+3 debris +20).

## Incident (pre-verdict config-key repair, fail-closed)

First attempt crashed at 3/20: the frozen menu names `replayGain`, which
is not a taste-energy config key (V1g used surprise-gated keys). The keys()
guard caught it before any verdict output. Repair: true plain `replayGain`
config (default 1.0 = bit-identical; guarded mul) + sandbox aligned to the
config path (was boost-param — would have tested 1+gain while live applied
gain). Debris preserved, dual provenance, fresh single-verdict run.
