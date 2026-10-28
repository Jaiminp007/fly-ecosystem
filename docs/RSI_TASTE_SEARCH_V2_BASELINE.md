# RSI search bank v2 baseline (Gen0, 4 fresh histories)

Amendment: `docs/RSI_TASTE_PLAN_AMENDMENT_V2.md`. Bank
`evidence/rsi-taste-v1/search-20261028-v2/protocol.json`
(bankSha `6cf32614…`, fresh). Gen0 config unchanged. 16 worlds, 0 proposals yet.

* seq +4.689 (4/4, +34 surv); vsReset +0.918 (4/4, −1 surv);
  **score 5.606** — new start line (cf v1-bank 5.024).
* A: retained 0.558 vs saved 0.972 → **descriptive 95% FALSE** (57%), −2 surv.
  aRetention-equivalent mean −0.37 (from rows: retained−0.95·saved mean).
* B: retained 0.731 vs saved 0.747 → true (98%), +4 surv.
* Transfer 0.0 tie.

Bank variability is now explicit across three search/eval banks:
v1-search A-false/B-true here too? v1-search had A-false/B-true as well
(A 0.78 vs 1.72 false, B 1.24 vs 0.93 true); RSI-eval had A-true/B-false.
The revision target is therefore bank-dependent; a genuine improvement must
lift the weak skill without breaking the strong one, then survive fresh eval.
No claim; proposals next under ≤96-world caps per procedure.

Evidence: `evidence/rsi-taste-v1/search-20261028-v2/gen0-search4/`.
Cumulative RSI: 48 eval + 192 v1-search + 16 v2-search = **256 worlds**.
