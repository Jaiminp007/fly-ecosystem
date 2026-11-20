# RSI C10 RESULTS V1 — C10-NOGO (neither eval adopts; bank-level null)

Date: 2026-11-02. Attempt-01 (single authorized): 20/0/35840/860160/
3.288e9, `redone: []`, caps respected. Bank fresh-26 (464001–464054)
SPENT. No incident (both fire paths verified: proposals recorded,
flip-marked correctly on looper, unmarked on standard — the
mechanisms ran; they adopted nothing).

## Verdict: C10-NOGO (pre-registered bank-level null)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 looper-train ≥0.5 | TRUE |
| G2a successive | FALSE (lift1 +0.029, lift2 +0.052) |
| **G2b flip-vs-standard** | **TRUE (+0.0275) but VACUOUS — see below** |
| G2c / G2d | TRUE / TRUE (same 0.91) |

- ZERO adoptions on BOTH eval paths (flip-looper {} and standard
  {} across train/T1; op1/op2 null both chains). The 5% bar is
  unpassable on this bank for all three operators under either
  objective. Second consecutive zero-adoption bank (463xxx flip,
  464xxx both) — the mechanism is proven working (fixtures adopt
  on synthetic; C6–C8 adopted on their banks), so this is
  bank-level experience poverty, not breakage.
- G2b +0.0275 is noise between two baseline arms (nothing adopted
  anywhere — no eval difference existed to measure). Disclosed as
  vacuous (same class as C7's +0.0001, larger magnitude).
- Matches pre-registered NOGO reading exactly: "(flat, neither
  adopts): C9 repeats (bank-level null)".

## Standing

- The flip-vs-standard question is NOT answered (needs a bank where
  something adopts). Re-running on a screened bank is FORBIDDEN
  (screening on eval = shopping). The question stays open but
  unanswerable by design — recorded as such, not quietly dropped.
- C-series exhausted: every licensed sub-question (transfer with
  weights, operator identity, dose, selection, alignment) has an
  answer or a preserved reason it can't. C11 needs a genuinely new
  rationale (none currently licensed).
- No RSI claim. Cumulative 8331 (+20 C10).
