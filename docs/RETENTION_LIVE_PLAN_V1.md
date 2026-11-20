# RETENTION-LIVE PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
Is task-A (stable foraging) skill retained WHILE task-B (moving foraging)
is being learned — measured live in the same world (not a transplanted
fresh probe), against an unlearned control?

## Why this line (not backward, not retention-during)
- Taste-backward (GO) measures a live return-A after B+C: live probes
  confound retention with relearning (M-RELEARN ceiling: 0-tick recovery).
- Retention-during (void) used frozen weights but transplanted into FRESH
  probe worlds: naive feasts fresh (0.88) so baseline never clears —
  ceiling by construction, depletion discarded.
- This line keeps BOTH fixes: frozen weights (no relearning confound) IN
  the same depleted world (no fresh ceiling). Replay-diverge design: per
  arm, 5 runs replay A→B deterministically to tick T ∈ {512,640,768,896,
  1024}, then THAT run switches to A-regime (direct enterCuePhase, same
  mapping family), freezes, measures 128 ticks live. Same positions,
  same depletion, same weights — only the regime switches. Deterministic
  replay = same world-state at T by construction (no checkpoint/restore,
  no engine change, no transplant).
- Different line by construction: no return-A endpoint (curve during B),
  no separate probe worlds, no live relearning, taste substrate (not
  odor R2 revisits — which were live + transfer-focused).

## Design (2 arms, 1 history per pair, 20 mains)
- Arms: candidate (learns) vs unlearned (naive, auto-frozen). 2 pairs ×
  (5 T-values × 2 arms) = 20 mains, 0 probes. One history per pair (all
  10 runs share it — deterministic replay controls layout; pairs differ).
- Per run: advance(T) [auto A/B phases, T≤1024 never reaches C], then
  resource=enterCuePhase(world,A,seeds[0],codebook), phaseEnd=1e9 (never
  fires in-measure), freeze all learners, advance(128), rate=(food_end−
  food_start)/128 (food_start read post-switch, amounts preserved by
  enterCuePhase — assert energy unchanged per its contract).
- Metric: colony food per tick over the 128-tick A-measure (live world,
  frozen weights). Backward-family food metric.
- Bank: fresh-07, 474073–474090 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage (novel op: mid-run regime
  switch): ONE throwaway run (T=512) on 490001–490009 (added to spent,
  disclosed) BEFORE the bank mint — exercises switch/freeze/measure
  without touching bank seeds. Caps: BT ticks/wall/op. Single attempt.
  Disk floor 1 GB.
- Verdict (pooled n=2): baseline T=512 must exceed unlearned ×1.1 else
  INCOMPLETE-NOLEARN (genuine — depleted world, no fresh ceiling).
  Else GO (`RETENTION-LIVE-GO-V1`) iff pooled T=1024 AND pooled mean
  (640/768/896/1024) exceed unlearned ×1.1; else NOGO
  (`RETENTION-LIVE-NOGO-V1`). All-zero feeding → INVALID. Retention
  only; no transfer/RSI/population claim.
