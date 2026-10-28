# RSI search wave 1 (procedure A, greedy) — no claimant

Plan: `docs/RSI_TASTE_REVISION_PLAN.md`. Search bank:
`evidence/rsi-taste-v1/search-20261027-v1/protocol.json`
(bankSha `83fb6bd4…`, 4 histories used of 8). Each proposal: 4 histories ×
4 arms (`candidate,unlearned,reset,acceptCruise`) = 16 worlds. Score =
mean(candidate-unlearned) + mean(candidate-reset), descriptive only.

## Protocol correction (0 worlds, preserved)

`p1-hold4` / `p2-hold16` with `motorRule=progress` are invalid:
`createTasteEnergyBody` requires `holdTicks===1` when `motorRule!=='td'`.
Error reproduced, no worlds spent. Valid menu is therefore:
`(td, hold∈{1,4,16})`, `(renewal|progress, hold=1)`. Plan menu is amended
accordingly; budget and gates unchanged.

## Wave-1 results (96 search worlds)

* `gen0-search4` (progress/hold1/taste1): seq +4.570, vsReset +0.453,
  **score 5.024** — incumbent, 16 worlds.
* `p3-td` (td/hold1): 2.780 + 0.039 = 2.819 (16 worlds).
* `p4-renewal` (renewal/hold1/0.1): 0.032 − 0.129 = −0.097 (16 worlds).
* `p5-taste01` (progress/hold1/taste0.1): 1.528 + 0.304 = 1.832 (16 worlds).
* `p6-td-hold4` (td/hold4): 3.195 + 0.294 = 3.489 (16 worlds).
* `p7-td-hold16` (td/hold16): 1.024 − 0.483 = 0.541 (16 worlds).

Total procedure-A wave 1: 96 worlds (cap reached). No neighbor beats Gen0;
**no claimant, no fresh eval, no acceptance**. B-retention on search bank is
positive for Gen0 here (`bRetention` +0.357 4/4) but `aRetention` is negative
(−0.852 0/4) — search-bank pressure profile differs from eval banks, which is
why search scores never substitute for fresh eval.

## Accounting

* Search worlds (A): 96. Eval worlds for revision: 0.
* Cumulative RSI: gen0 eval 48 + search 96 = 144 worlds.
* Procedure B (random, matched 96 worlds) not yet run — productivity comparison
  pending. No RSI, no revision, no qualification claimed.

Evidence: `evidence/rsi-taste-v1/search-20261027-v1/{gen0-search4,p3-td,p4-renewal,p5-taste01,p6-td-hold4,p7-td-hold16}/`.
Next: run matched random B (≤96 worlds), then decide gen1 direction (wider menu
or accept no-revision outcome for this line).
