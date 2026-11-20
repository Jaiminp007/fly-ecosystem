# RSI C5 PLAN V1 (gains + transplant: the C4 question, correctly) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: C4's INVALID
(``gains+transplant UNTESTED → C5 licensed''); C4's machinery is proven
(exact transplant + wound replicated 0.28 + sandbox vote + flip-split
scorer all valid — only the menu indices were wrong). Fixes C4's sole
deviation: menu 0/1 (gains) asserted in fixtures this time.

## Design (C4-verbatim EXCEPT menu indices + menu-assertion fixtures)

Per chain (H0/H1/H2), same-arm exact transplant + voted op carryover,
proposal ticks {1024}, lifetime 1/run, temporal sandbox split,
majority-vote carryover, 2 chains × 10 runs = 20 mains, 0 probes,
flip-split HB scorer, G0/G1/G2a/G2b/G2c/G2d, verdicts C5-*.
- `looper-train` proposes op1=**menu 0 (gain 0.5)**; `looper-T1`
  proposes op2=**menu 1 (gain 1.0)** (the C2 operators — C2-fresh vs
  C5-transplant isolates the transfer component, descriptively).
- Static/copied arms + unlearned as in C4. Shrink/skip/gain-2.0 untried.
- Fixtures 15 (C4's 14 adapted: menu constants asserted 0/1 against
  OL_MENU kinds + a live-fire role check that the voted op IS a gain;
  transplant/bank/caps/scorer guards as C4).

## Bank, caps, attempt discipline (C4-verbatim, fresh range)

- Fresh-21 bank `evidence/rsi-c5-dev/fresh-21/`, 9-schema, 6×9,
  range **459001–459054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-21 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 458xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.

## What GO/NOGO mean

- GO: internally-proposed GAINS lift real transfer (≥2 successive +
  productivity) → RSI CLAIM (first ever if met; bars unmoved).
- NOGO (flat vs static): gains don't help transfer even with weights
  (operator null for transfer-extinction — V1h's surprise-gating stays
  the only transfer-positive operator, and it was NOT internally
  proposed, bounding the loop's product space further).
- NOGO (static high): exact-transfer already high on this bank
  (ceiling informative).
