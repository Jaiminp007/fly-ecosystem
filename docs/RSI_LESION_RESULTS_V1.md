# RSI-LESION V1 verdict (2026-11-04) — NOGO (scored)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 2G before and
after; output 1.2M). Frozen plan `docs/RSI_LESION_PLAN_V1.md`. Last
standing adoption-capable edit (full audit in plan: every other weight
edit banned, scored-failed, closed, void-structural, or rationale-free).
Fixtures 6/6 green pre-run (zero worlds; one D-constant repair pre-run —
pairwise default D=11 vs orthogonal run D=16, fixture made agnostic);
triage on throwaway 490019–490027 (3/24 adopts at first checkpoint —
fires, not structural void); bank 474109–474144 minted post-triage,
verified clean. Single attempt, as measured. No rescoring.

## Results (pairs 474109→474118, 474127→474136)
G1+G2 pass (ledger 12 mains, digests match, configs audited).
Proposals: 135 evaluated, **12 adopts (9%) — half:0 ×5, half:1 ×7**.
Transfer means: selfmod −62.140 < fixed −61.945 < unlearned −59.300.
Verdict: **RSI-LESION-NOGO-V1**.
Per-history split: 474118 selfmod −61.97 beats fixed −62.32; 474136
selfmod −62.31 loses to fixed −61.57. Mean gap −0.19, one history.

## Reading
- The loop FIRED with a balanced pattern (5/7 across halves — no
  localization: had skill lived in a dim subset, adoptions would
  concentrate; they don't). The sandbox found both ablations
  prediction-helpful at ~equal rates, yet transfer is split/null and
  unlearned wins both pairs. Denoise-by-localization fails on both
  halves of its rationale (no localization found; no transfer gained).
- Sixth self-proposal family scored-failed on energy transfer (rate,
  menu, freeze, reset-void, surprise, lesion). The program's ledger now
  reads: every sandbox-adopted weight edit optimizes prediction at
  transfer's expense or irrelevance, and unlearned init wins throughout.
  The lesion family is CLOSED as scored (no replication without fresh
  rationale). No RSI/retention/population claim.
- Adoption asymmetry preserved: halvings fire (9%) where full resets
  never did (0/133) — partial edits stay sandbox-visible, full erasure
  doesn't compete. That visibility is necessary but, six families in,
  never sufficient for transfer.

## Preservation
`evidence/rsi-lesion-dev/fresh-09/` (bank, now spent) +
`evidence/rsi-lesion-dev/attempt-01/` (untracked raw evidence, 1.2M).
