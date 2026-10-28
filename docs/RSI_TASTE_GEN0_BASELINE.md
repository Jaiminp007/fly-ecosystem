# RSI gen0 baseline (eval-20261027-v1, 8 fresh seeds)

Plan: `docs/RSI_TASTE_REVISION_PLAN.md`. No revision, no search worlds yet.
Bank: `evidence/rsi-taste-v1/eval-20261027-v1/protocol.json`
(bankSha `f9b8988b…`, fresh vs dev/v1/v2). Config Gen0 = qualified ecology
(`fbb4787a…`). 48 eval worlds, 0 search worlds.

## Result: mixed — lifetime holds, B-retention fails on these seeds

* vs unlearned +5.619, 8/8, +69 — would pass.
* vs frozen +3.795, 8/8, +37 — would pass.
* vs reset +0.881, 6/8, +10 — would pass noninferiority (losses -0.590, -1.097).
* A: retained 1.407 vs saved 1.220 → descriptive 95% true, +3 surv;
  `aRetention` +0.248, 6/8 — would pass.
* B: retained 1.509 vs saved 1.589 → **descriptive 95% FALSE** (94.97%), -4 surv;
  `bRetention` **-0.00056**, 4/8 — **would fail** (needs mean>0).
  Effects: `[-0.822, +0.149, +0.104, +0.668, -0.587, -0.818, -0.107, +1.408]`.
* Transfer vs reset 0.0 exactly, surv 0 — would pass noninferiority.
* Skills exist: aSkill +1.22 8/8, bSkill +1.589 8/8, bAcq +0.827 7/8.

Verdict: Gen0 does **not** reproduce the full v2 gate set on RSI eval seeds.
v2 PASS stands only on its own bank; generality is not established. This is
the honest start line for the revision game (48 worlds spent, 0 search).

## Implication for revisions

The failure is specific and small: B-retention ~0. The search menu
(`hold`, `motorRule`, `tasteRate`, `renewalRate`) must find a config that
lifts B-retention above 0 while holding lifetime vs unlearned/frozen,
vs-reset noninferiority, A-retention, and transfer — on search bank first,
then fresh eval. If no config does this under matched budget, the RSI chain
fails there. No tuning on this eval bank; search uses a separate bank next.

Evidence: `evidence/rsi-taste-v1/eval-20261027-v1/gen0-baseline/`.
