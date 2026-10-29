# WHAT-RETAINS results — diagnostic on spent M-GATE + S-GATE banks (CLOSED)

Frozen plan: `docs/WHAT_RETAINS_PLAN_V1.md`. Zero new worlds, zero seeds, zero
bank draws (python3 stdlib only: `json, math, os, statistics`; no engine
imports; no writes to `evidence/`). All four answers below; the single
licensed follow-up is §5.

## Q1 — arm-decomposition: the level gain is exploration tax, not learning

- Arm endpoints are identical across taus within a study (treatment moves
  almost nothing at the mains level). Control means: candidate −59.1/−59.7,
  unlearned −64.6/−64.3, frozen −62.0/−62.6, reset −59.1/−59.1.
- Level (candidate−unlearned ≈ +5.5/+4.5) decomposes as: reset ≈ candidate
  (within 0.1–0.6) while unlearned trails reset by ~5. The "development gain"
  over unlearned is the unlearned arm PAYING EXPLORATION, not the candidate
  WINNING anything training adds ~0 over resetting (prior reset-noninferiority
  decision, independently confirmed on 8 fresh histories).
- Aret is NOT same-body re-exposure: |A:current−A:A| (0.167–0.686) exceeds
  0.05·|Aret| (0.009–0.036) on 8/8 control histories → 0/8 pass the rule.
- Rules: re-exposure proposal NOT licensed (0/8); no arm-concentration
  pattern across taus/histories (frozen/reset track the same ordering
  everywhere) → NO arm-targeted follow-up licensed.

## Q2 — dose-response: weight-volume is irrelevant (Pearson −0.443, Spearman −0.167, N=8)

- Learning distances are near-CONSTANT (2.018–2.154, 7% spread) while
  retention spans −0.56…+0.72. There is almost no dose variation to explain
  the outcome variation; rank association is null (−0.167). The Pearson
  −0.443 is noise amplified on near-constant X (N=8), not a real negative
  dose-response.
- Rule: no positive dose-response → NO volume-based follow-up, ever
  (consistent with the V3 two-timescale failure). Rehearsal-for-volume is dead.

## Q3 — alignment-vs-retention: |r| = 0.116 < 0.3 on N=24 → DIRECTION-PROTECTION CLOSED PERMANENTLY

- Pearson +0.116, Spearman +0.026 across 12 M-GATE + 12 S-GATE gated points.
- Per the frozen rule, the V3 premise (alignment → retention) is dead as a
  research direction — uniform, motor, asymmetric-gated, symmetric-gated, all
  variants. S-GATE's τ-0 arm raising alignment (0.7113 vs 0.6999) with zero
  retention benefit is the same dissociation, now with N=24 behind it.

## Q4 — calibration stable: max decile |Δ| = 0.033 ≤ 0.05 → G1 STANDS

- Both banks' decile curves monotonic (0.43→0.88, 0.45→0.85). Margin-predicted
  outcomes are bank-independent. Margins remain the only validated substrate.

## Licensed follow-up proposal (proposal ONLY — needs its own frozen plan + fresh goal; no worlds here)

Q1–Q3 license no intervention and close two families (direction, volume).
The single licensed follow-up is **M-ORIGIN**: a frozen DESCRIPTIVE study of
the exploration-tax mechanism — decompose the level gain (candidate≈reset≫
unlearned) into exploration-ops vs outcome-energy from the ledgered arm
endpoints already on disk (zero new worlds), asking why the unlearned arm
pays ~5 energy that resetting avoids. Rationale: the only positive-magnitude
development signal left unexplained is the exploration deficit, and every
protection family assumed the gain was learning worth keeping — it may be
loss worth not incurring. If M-ORIGIN finds the tax is decision-structured
(e.g., concentrated in low-margin exploration), it may in turn license a
non-directional margin use; if unstructured, close that too.
