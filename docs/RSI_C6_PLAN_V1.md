# RSI C6 PLAN V1 (internal surprise: the last operator cell) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: C5's close
(``V1h's surprise-gain stands alone (externally imposed, never
internally proposed)''); the loop menu (OL_MENU 0-5) contains no
surprise operator — C6 adds one. Last untried cell of the
selection×transfer matrix (gain/skip × fresh/transplant all null).

## Design (C5-verbatim EXCEPT the proposed operator)

Per chain (H0/H1/H2), same-arm exact transplant + voted op carryover,
proposal ticks {1024}, lifetime 1/run, temporal sandbox split,
majority-vote carryover, 2 chains × 10 runs = 20 mains, 0 probes,
flip-split HB scorer, G0/G1/G2a/G2b/G2c/G2d, verdicts C6-*.
- New loop menu index 6 = **surprise-gated gain** (gain value 3.0 on
  the replay path gated by the V1h surprise signal; null-default
  module addition: OL_MENU append-only, indices 0-5 untouched —
  all prior lines bit-identical; fired only when proposed+adopted).
- `looper-train` proposes op1=**menu 6**; `looper-T1` proposes
  op2=**menu 6** (same operator twice: successive = repeated
  internal adoption of surprise-gating; sandbox-evaluated each time).
- Static/copied arms + unlearned as in C4/C5 (copied carries the
  voted surprise-gate blind).
- Fixtures 16 (C5's 15 adapted: menu-6 kind assertion + surprise-gate
  null-default bit-identity (menu 6 never fired → V1h path off) +
  live-fire role check that the voted op IS surprise-gated gain).

## Bank, caps, attempt discipline (C4/C5-verbatim, fresh range)

- Fresh-22 bank `evidence/rsi-c6-dev/fresh-22/`, 9-schema, 6×9,
  range **460001–460054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-22 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 459xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.

## What GO/NOGO mean

- GO: internally-proposed surprise-gating lifts real transfer (≥2
  successive + productivity) → RSI CLAIM (first ever if met).
- NOGO (flat vs static): even the transfer-positive operator fails
  when internally proposed (sandbox can't find it / adoption mistimed
  — loop limitation, operator exonerated; the internal/external gap
  becomes the licensed next question).
- NOGO (static high): ceiling informative.
