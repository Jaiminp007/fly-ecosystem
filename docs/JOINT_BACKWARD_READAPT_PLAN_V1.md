# JOINT-BACKWARD-READAPT PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
On the SAME fresh seeds, do the taste-backward return-to-A measure and
the live readapt measure agree on whether A-skill survives B?

## Why joint (not either alone — both are excluded alone)
- Backward-GO (old bank): live return-A candidate > unlearned.
- Readapt-void (old bank): live A-recovery candidate < naive at all
  points, baseline fails. Same question (does A survive B live?),
  opposite answers — but different seeds, different designs (continuous
  A/B/C/return vs replay-diverge A→B + A-switch; 1536-depleted return
  vs ≤1024-depleted measures; novel vs familiar layouts).
- Same seeds isolates design-vs-substance: if backward-positive
  reproduces while readapt-negative reproduces on identical histories,
  the disagreement is instrument, not seed luck — and the axis that
  differs (C-phase, depletion depth, layout novelty, continuity)
  becomes the licensed next question. If both agree either way, one of
  the priors was bank-specific. Any cell is informative; the vote is
  pre-registered below.

## Design (24 mains: backward-lite 4 + readapt-full 20, same 2 histories)
- Bank: fresh-11, 474163–474180 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Thin n=2 (program minimum).
- Backward-lite per history (verbatim backward run, no frozen arm):
  candidate + unlearned full A/B/C/return-A (1792, auto phases, BT
  options). Measure: segmentRates retA food rate + A rate (imported
  backward scorer core). Frozen arm dropped (disclosed): the
  disagreement test needs only candidate-vs-unlearned gaps; frozen
  tolerance is backward-internal. Backward-positive := pooled retA cand
  > pooled retA un ×1.1 (backward-tolerance scale).
- Readapt-full per history (verbatim readapt runOne, imported): 5
  T-values × 2 arms (candidate learns; unlearned frozen prefix +
  unfreeze-at-switch, acquisition=true). Measure: 128-tick live
  A-recovery food rate. Readapt-positive := pooled T=1024 AND pooled
  mean-during-B exceed matched naive ×1.1 (baseline guard reported but
  NOT voiding here — the joint question needs both directions scored;
  a failed baseline counts as readapt-negative, disclosed).
- Joint verdict (pooled n=2, pre-registered 2×2):
  backward-positive + readapt-positive → JOINT-AGREE-BOTH-POSITIVE;
  both negative → JOINT-AGREE-BOTH-NEGATIVE;
  backward-positive + readapt-negative → JOINT-DISAGREE (return says
  retained, ladder says not — instrument effect, axis for next license);
  backward-negative + readapt-positive → JOINT-DISAGREE (mirror).
  No RSI/transfer/population claim; retention reported per-measure only.
- Triage (wiring only, no novel ops): ONE throwaway history
  490037–490045 — 1 backward candidate run + 1 readapt runOne
  (candidate T=512) — proving the joint driver wires both imports.
  Added to spent, disclosed, BEFORE bank mint. Caps: BT. Single attempt.
  Disk floor 1 GB.
