# RSI C3 RESULTS V1 — C3-NOGO (design flaw disclosed; verdict stands)

Date: 2026-11-02. Attempt-01 (single authorized): 20/0/35840/860160/3.356e9,
`redone: []`, caps respected (4.0e9/10800s). Bank fresh-19 (457001–457054)
SPENT. No incident (clean run; replayGain-key repair from C2 held).

## Verdict: C3-NOGO (gates fail as written)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 looper-train ≥0.5 | TRUE |
| G2a-PRIMARY successive lifts | FALSE (lift1 −0.001, lift2 +0.000) |
| G2b looper − copied > 0 | FALSE (+0.000 exactly) |
| G2c unlearned flat | TRUE |
| G2d same floor ≥0.5 | TRUE (0.90) |

Adoptions occurred (train: skip-0.05 by 3 agents; T1: skip-0.1 by 1 agent;
majority vote carried both). Transfer HB identical everywhere
(0.947–0.950): adopted selection operators change nothing.

## Design flaw (disclosed, bounds the NOGO — does not void it)

C2/C3 called T1/T2 "transfer runs," but they are FRESH runs (zero
weights; no transplant): the agent carries no train knowledge, so the
flip-split HB is NOT transfer-extinction — it is fresh-learning HB,
which sits at ceiling (~0.95, nothing preserved to extinguish). The G2a
yardstick (+0.1 over a 0.95 static baseline) was unpassable BY
CONSTRUCTION, not by evidence. The valid reading of the data:
**adopted operators do not improve fresh learning** (operator
generalization null — consistent with acquisition-live-dominated +
no-preservation-to-overcome). The INVALID question ("successive
transfer improvement") was not tested; the NOGO answers the valid one.
No rescoring (gates failed as written), no re-run (single attempt
spent), line closed with the flaw on the record.

## What stands (not voided)

- Loop capability (C1/C2 mechanical findings): proposals fire,
  sandbox evaluates, adoptions occur and carry by vote — replicated
  in C3 (skip ops adopted 3+1). Untouched by the flaw.
- Sandbox→live proxy failure: sandbox adopted skips that changed
  nothing live (second instance after C2 gains).
- Selection-family result: skip (surprise-mirror) joins gain/damage/
  threat as inert for acquisition/fresh learning (third/fourth
  instance; extinction-transfer of selection remains the only
  untested cell — V1h stands alone).

## Standing

- No RSI claim (bars unmoved and unmet). The C2/C3 pair tested the
  internal loop twice; the loop works, its products don't transfer —
  and the transfer test itself was misframed (fresh runs, not
  transfer). A valid successive-transfer test needs weight carryover
  (transplant) + operator carryover jointly — specified here as the
  requirement for any C4, not attempted here.
- Line CLOSED. Cumulative 8191 (+20).

## Cumulative: 8191 worlds (8171 + 20 C3 mains).
