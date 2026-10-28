# RSI gen3 fresh eval (mem64-8 claimant) — FAIL, no acceptance

Claimant: (capacity 64, recent 8), search score 6.207 vs Gen0-memory 5.673.
Fresh bank `evidence/rsi-taste-v1/gen3-eval-20261030-v1/protocol.json`
(bankSha `750b7ff7…`, 8 new histories), full 6 arms, 48 worlds. Code adds
nothing new since amendment v3 (same parameterized body).

## Outcome vs v2 gates: FAIL

* vs unlearned +3.50, 8/8, +68 — pass. vs frozen +2.63, 8/8, +48 — pass.
* vs reset +0.46, **5/8** (exactly at floor), +14; worst −0.70 ≥ −1.00 — pass
  noninferiority, fragile.
* Skills exist: aSkill +0.84 7/8, bSkill +1.37 8/8, bAcq +1.02 6/8 — pass.
* Descriptive retention both TRUE (A 0.92/0.84 = 110%, +6 surv; B 1.51/1.37 =
  110%, +3 surv) — but the strict pressure margin decides:
* **aRetention +0.12, 3/8** (losses −0.03,−0.23,−0.08,−0.16,−0.54) — **FAIL**
  (needs mean>0 ✓, ≥4/8 ✗, surv≥−2 ✓). bRetention +0.21, 5/8 — pass.
* Transfer 0.0 exactly, 8/8, surv 0 — pass noninferiority.

Verdict: **no acceptance**. Same signature as gen1 (td): search-bank gains do
not survive the fresh-seed A-retention margin — five small fresh losses instead
of four. The 64-slot reservoir did not fix A-retention; descriptive ≥95% holds
while the joint margin rejects. Guard working as designed.

## Accounting

* gen3 round: A4 96 + B4 96 + gen3-eval 48 = 240 worlds.
* Cumulative RSI: prior 720 + 240 = **960 worlds**.
* Bank `750b7ff7…` spent. Successive acceptances: **0/2**. No RSI; Gen0-memory
  unrevised. Next: new dimension or suspend revisions.
