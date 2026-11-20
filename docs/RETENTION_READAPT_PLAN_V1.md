# RETENTION-READAPT PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
While task B is being learned, does task-A skill recover live — with
learning left ON — better than a live unlearned control in the same
(matched) world?

## Why this line (completes the 2×2, attributes the mechanism)
- Frozen cells both voided (fresh-probe ceiling; same-world frozen
  trained < naive 30/30): weight CONTENT alone never beats init.
- M-RELEARN proved wipe-to-criterion costs 0 ticks: live dynamics
  recover instantly. This line tests the remaining cell (live weights,
  same world): replay-diverge identical to retention-live, except NO
  freeze at the A-switch (candidate keeps learning) and the unlearned
  control UNFREEZES at the switch (acquisition=true — naive weights +
  live relearning, the fair live baseline). If B-training helps live
  recovery → GO (content + dynamics); if tie → NOGO (dynamics alone,
  weights irrelevant live); if naive wins → NOGO (training hurts live).
- Pre-registered ambiguity: with learning on, this line CANNOT separate
  retention from relearning (M-RELEARN ceiling). A GO here means "live
  cope", NOT "weight retention" (that question belongs to the frozen
  cells, both void). The 2×2 then reads: retention appearance requires
  learning-on (dynamics); weight content alone never suffices. That
  attribution IS the milestone-relevant finding.

## Design (minimal delta from retention-live: one flag per arm)
- Same replay-diverge (T ∈ {512,640,768,896,1024}, A-switch via direct
  enterCuePhase, phaseEnd=1e9, 128-tick live measure, food rate), same
  20 mains (2 pairs × 5 T × 2 arms), same bank shape (18 seeds).
- Candidate: learning ON throughout (no freeze — the delta). Unlearned:
  frozen-naive prefix (auto), UNFREEZE (acquisition=true) at switch,
  live A-measure (fair live baseline). Matched histories per pair.
- Bank: fresh-08, 474091–474108 (18 seeds), minted post-fixtures,
  verified clean. Triage (novel op: unfreeze + no-freeze switch): TWO
  throwaway runs (candidate + unlearned, T=512) on 490010–490018 (added
  to spent, disclosed) BEFORE bank mint. Caps identical. Single attempt.
  Disk floor 1 GB.
- Verdict (pooled n=2, matched-T naive): baseline T=512 must exceed
  unlearned ×1.1 else INCOMPLETE-NOLEARN (genuine — depleted world).
  Else GO (`RETENTION-READAPT-GO-V1`) iff pooled T=1024 AND pooled mean-
  during-B exceed matched naive ×1.1; else NOGO
  (`RETENTION-READAPT-NOGO-V1`). All-zero → INVALID. No transfer/RSI/
  population claim.
