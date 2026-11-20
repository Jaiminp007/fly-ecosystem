# RSI C6 RESULTS V1 — C6-NOGO (nearest miss; dose-monotone)

Date: 2026-11-02. Attempt-01 (single authorized): 20/0/35840/860160/
3.305e9, `redone: []`, caps respected. Bank fresh-22 (460001–460054)
SPENT. No incident (menu-6 adoption verified live: both chains
`replaySurprise`, adopted 8+10).

## Verdict: C6-NOGO (gates fail as written)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 looper-train ≥0.5 | TRUE |
| G2a successive | FALSE (lift1 **0.0964** < 0.10; lift2 +0.156 ✓; T2≥T1 ✓) |
| G2b productivity | FALSE (looper − copied = −0.03) |
| G2c / G2d | TRUE / TRUE (same 0.90) |

Missed by 0.004 on lift1; failed G2b by 0.03. No rounding, no
rescore, no re-run. Line CLOSED as NOGO.

## Substance (first positive internal-proposal signal in the C-series)

Internally-proposed surprise-gating LIFTS transfer vs static:
T1 +0.096, T2 +0.156 (adopted 18 votes, sandbox-found, live-carried).
The decomposition of the failure:
- (a) Near-miss: lift1 0.0964 vs 0.10 bar — evidence strength, not
  direction, falls short.
- (b) Dose confound on G2b: copied (full-run gate from tick 0)
  0.488 > looper (half-run gate, adopted @1024) 0.458 > static
  (no gate) 0.33 — MONOTONE IN DOSE. The productivity gate as
  written punishes the loop for adopting mid-run (a loop-timing
  property, pre-registered as limitation) rather than testing
  selection. A dose-matched productivity test (copied half-dose,
  or looper adopting @0) is the licensed C7 question — NOT run here.
- Contrast with C5: looper compounds FASTER than static here
  (0.41→0.51 vs 0.31→0.35); surprise participates in compounding
  where plain gains suppressed it.

## Standing

- The pre-registered NOGO-flat reading is SUPERSEDED by the data:
  the operator works when proposed (+0.10/+0.16); the loop's
  limitation is timing (dose), not selection. No RSI claim (bars
  unmoved and unmet — a near-miss is a miss).
- C7 (dose-matched productivity) specified, unfrozen, unbuilt.
- No RSI claim. Cumulative 8251 (+20 C6).
