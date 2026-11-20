# RSI C16 AMENDMENT A1 (pre-implementation tag-list correction)

Date: 2026-11-02. The frozen PLAN V1 lists tags (switch, static,
exact-switch, exact-static, copied, unlearned-H2-only) with "8 runs/
chain × 2 chains = 16 mains" — which does not sum (6–7/chain
depending on reading). Correction (design only, caps unchanged —
16/0/28672/688128/3.4e9/10800s already assume 16 mains):

Per chain (train HT + transfer histories HEa/HEb), 8 runs:
train(1) + switch-T1 + static-T1 + switch-T2 + static-T2 +
copied-T1 + exact-switch-T1 + unlearned(1) = 8. ×2 chains = 16.

- exact-static DROPPED: exact-switch alone probes wound-depth
  (does the switch fire+lift where the wound is deepest?); the
  exact baseline (0.31/0.62) is established by C2–C15, no need to
  re-spend mains re-measuring it. G2a/G2b/G0/G2c wordings that
  referenced exact-static now reference exact-switch descriptively.
- unlearned runs PER CHAIN (standard flat control), not H2-only.
- copied-T1 only (T1; the flag-isolation check needs one leg).
- Bank unchanged: 6 histories = 2×(1 train + 2 transfer) ✓.

No other change. G2a-PRIMARY (switch−static ≥ +0.1 on T1 AND T2,
T2 ≥ T1), G2b (switch−copied pooled > 0), G0, G2c direction guard,
verdicts C16-* all stand.
