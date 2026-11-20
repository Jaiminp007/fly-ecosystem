# RSI C9 RESULTS V1 — C9-INVALID-DESIGN (G2b comparison missing)

Date: 2026-11-02. Attempt-01 (single authorized): 20/0/35840/860160/
3.302e9, `redone: []`, caps respected. Bank fresh-25 (463001–463054)
SPENT. No incident (flip fire verified: 72 proposals/row, all marked
flipped, purity held — the mechanism ran correctly).

## Verdict: C9-INVALID (design flaw — G2b untestable as built)

The plan specified G2b as flip-eval vs STANDARD-eval. The instrument
contains NO standard-eval arm: the looper runs flip-choice and the
copier carries the looper's flip-vote blind (C8's structure with flip
substituted for standard). Both arms are flip-derived; the planned
comparison does not exist in the data. (Same flaw class as C4/C7:
plan-code drift, mine, disclosed.)

## The data are nevertheless real

- Flip-eval adopts NOTHING on this bank (72 proposals/row × 6 train
  rows, zero adopted; op1/op2 null both chains): no operator —
  including surprise, which passed standard-eval on C6–C8 banks —
  clears the 5% bar on flipped held-out here. Flip-eval is either
  strictly harder than standard-eval, or this bank supports no
  operator at all — UNSEPARABLE without the missing standard arm
  (not attempted: bank spent, no rerun).
- All arms ran baseline (wound ~0.25–0.30 replicated); lifts
  −0.003/−0.035 are baseline noise, not operator effects.
- G2a false as written (nothing adopted). No rescore (nothing to
  rescore — the gates reference a comparison that wasn't run).

## Standing

- C10 specified (the true C9 question): looper-flip (per-agent
  flip-choice) vs standard (per-agent standard-choice, same
  dose/timing) + static; copier retired (blind-majority answered
  in C7/C8). Fresh plan + fresh bank required.
- No RSI claim. Cumulative 8311 (+20 C9).
