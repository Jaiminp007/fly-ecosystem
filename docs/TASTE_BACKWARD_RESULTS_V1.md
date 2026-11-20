# TASTE-BACKWARD V1 verdict (2026-11-03) — GO, thin, licenses replication only

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 5G before and
after; output 945K). Frozen plan `docs/TASTE_BACKWARD_PLAN_V1.md`. New
question (behavioral backward retention — never scored: probe-values were
0/6 FALSE, V-series measured forward tax, DTR blocker #3 noted no backward
scorer exists; this instrument BUILDS it). Fixtures 5/5 green pre-run
(zero worlds); bank 473028–473045 minted post-fixtures; single attempt.

## Results, histories 473028/473037 (6 mains / 0 probes, G1+G2 pass)
Pooled per-tick food rates (A → return-A):
- candidate: 0.4041 → 0.2915, drop 0.1127.
- frozen (A-weights held): 0.4041 → 0.1628, drop 0.2413.
- unlearned (never learns): 0.7839 → 0.2724, drop 0.5115.
- tol 0.0404. Verdict: **TASTE-BACKWARD-GO-V1** — candidate drop <
  unlearned drop, candidate retA-rate (0.2915) > unlearned (0.2724),
  candidate drop ≤ frozen drop + tol.
- A-rates candidate == frozen both histories (0.3714/0.4369) — the
  frozen-A design validated in-line (identical A learning, divergence
  only after B/C).

## Reading (stated thin)
Lifetime learning retains A-skill through B/C better than depletion +
naivety explain, and better than holding A-weights fixed: B/C learning
does NOT destroy A behavior here — it protects it (candidate drop less
than half frozen's). Margin on the naive-rate prong is thin (0.2915 vs
0.2724). Texture (descriptive): unlearned eats most overall (2121) and
dies most (2/2 survivors); candidate eats least (1571), survives most
(11/9); energy candidate > frozen > unlearned. Learning buys efficiency
and survival, not intake — consistent with the metabolic-cost record.
No distinct-task/DTR/population/RSI claim. Next: replication under its
own frozen plan — not started.

## Preservation
`evidence/taste-backward-dev/fresh-01/` (bank, now spent) +
`evidence/taste-backward-dev/attempt-01/` (untracked raw evidence, 945K).
