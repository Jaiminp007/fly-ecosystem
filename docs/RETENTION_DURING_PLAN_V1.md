# RETENTION-DURING PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
Is task-A (stable foraging) skill retained WHILE task-B (moving foraging)
is being learned — measured during B, not by returning to A afterward —
against an unlearned control?

## Why this line (not taste-backward)
- Taste-backward (GO) measures a LIVE return-A phase after B+C: its probes
  keep learning, so its GO confounds true retention with relearning speed
  (M-RELEARN proved wipe-to-criterion costs 0 ticks — recovery is instant
  even from zero). A live return cannot distinguish "never forgot" from
  "relearned in 0 ticks."
- This line measures with FROZEN probes (transplanted weights, updates
  held — pure weight readout, zero relearning) INTERLEAVED during B
  (curve, not endpoint): post-A baseline, B-mid ×3, post-B. Different
  temporal structure (during vs after), different probe (frozen vs live),
  different worlds (snapshot probes vs same-run phase). The question it
  answers — does A-skill survive ongoing B-interference — is unanswered:
  backward-GO is compatible with both full retention and full forgetting
  + instant relearning. Either outcome is informative (GO confirms
  backward as true retention; NOGO corrects it to relearning artifact).
- Tasks reuse the precedented regime construction (CONTINUAL_PHASES
  stable=A vs moving=B, same as backward/R2). Probe layouts are NOVEL
  stable (pair-specific fresh histories — same novelty as backward's
  seeds[3] return, avoiding the M-RELEARN naive-ceiling on familiar
  layouts; backward-GO de-risks the baseline).

## Design (measurement line — no self-proposal, two arms)
- Arms: candidate (learns A→B, 1024 ticks: A 512 + B 512, chunked advance
  512+128×4) vs unlearned (naive, no train). NO frozen arm (backward
  already holds that control; smallest instrument = 2 arms).
- Snapshots per pair: post-A (512), B-mid (640/768/896), post-B (1024) =
  5 weight snapshots via snapshotWeights (V1 transplant pattern).
- Probes per snapshot: fresh run on the pair's PROBE history (novel
  stable layout), transplant snapshot weights (assertFreshTarget +
  digest match, V1 pattern), freezeTasteEnergyBody all learners (pure
  readout, no updates), advance 256 (within phase A, no transition),
  metric = colony food per tick. Unlearned: same probe history, naive
  weights, frozen, 1 run per pair (deterministic exact baseline).
- Ledger per pair: 1 train + 5 candidate probes + 1 unlearned probe =
  2 mains + 12 probes total (2 pairs). Ops ≈ 0.5e9 (well under caps).
- Bank: fresh-06, 474037–474072 (4 histories × 9: 2 train + 2 probe,
  36 unique), minted post-fixtures, verified clean. Caps: backward ticks/
  caps (train 1024 ≤ BT, probes 256). Single attempt. Disk floor 1 GB.
- Verdict: baseline (post-A) must exceed unlearned ×1.1 (10% margin,
  backward-tolerance scale) else INCOMPLETE-NOLEARN (void — no skill to
  retain). Else GO (`RETENTION-DURING-GO-V1`) iff post-B > unlearned ×1.1
  AND mean-during-B > unlearned ×1.1; else NOGO
  (`RETENTION-DURING-NOGO-V1`). No transfer/RSI/population claim
  (retention only, thin n=2).
