# RSI gen1 fresh eval (a2-td claimant) — FAIL, no acceptance

Claimant from `RSI_TASTE_SEARCH_WAVEA2.md`: td/hold1 (else Gen0), search score
7.60 vs Gen0 5.61 on `search-20261028-v2`. Fresh bank
`evidence/rsi-taste-v1/gen1-eval-20261028-v1/protocol.json`
(bankSha `f0d44a06…`, 8 new histories, never searched). Full 6 arms, 1792
ticks, 48 eval worlds. Code unchanged (`taste-energy.mjs:fbb4787a…` for Gen0
source; claimant differs only by `motorRule` td vs progress).

## Outcome vs predeclared v2 gates: FAIL

* vs unlearned +4.00, 8/8, +69 — pass.
* vs frozen +2.89, 8/8, +39 — pass.
* vs reset +0.31, 6/8, +10 (losses −2.85, −0.78) — 7/8 ≥ −1.00, mean ≥ −0.50:
  pass noninferiority.
* Skills exist: aSkill +1.35 8/8, bSkill +1.27 8/8, bAcq +1.17 7/8 — pass.
* A retention: retained 0.950 vs saved 1.352 → descriptive FALSE (70%), −4 surv;
  `aRetention` −0.335, 2/8 — **FAIL** (needs mean>0, ≥4/8, surv≥−2).
* B retention: retained 1.379 vs saved 1.268 → true, +3 surv; `bRetention`
  +0.174, 5/8 — pass.
* Transfer (candidate−reset): mean **−0.140**, 0/8, surv 0; worst history
  **−1.118** — **FAIL** floor (needs mean ≥ −0.25 ✓ but all 8 ≥ −0.50 ✗).
  The claimant that tied reset on search banks loses transfer on one fresh
  history: learned weights underperform zeroed weights in the odor-free probe.

Verdict: **no acceptance**. Search-bank winner does not generalize; it trades
B for A on search, then loses A and transfer on fresh seeds. This is the
required fresh-task guard working as designed. The B-wave (seed 57639099, best
3.67, no claimant) likewise yields no acceptance, so productivity is
no-advantage-either-way, not a candidate win.

## Accounting

* gen1 round: A-search 96 + B-search 96 + gen1-eval 48 = 240 worlds.
* Cumulative RSI: prior 352 + 96 (B2) + 48 (gen1-eval) = **496 worlds**.
* Bank `f0d44a06…` now spent; reuse becomes exploratory.

Evidence: `evidence/rsi-taste-v1/gen1-eval-20261028-v1/a2-td-fresh/`.
Next: gen2 direction — (i) new search/eval banks with a menu that jointly holds
A-retention and transfer (e.g. cruise/taste-form interactions), or (ii) close
the td line as a fresh-eval failure and keep Gen0 unrevised. No RSI: 0 successive
acceptances of the required ≥2.
