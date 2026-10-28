# RSI gen4 line (predeclared): retention-first claimant (32,16)

## Why a second line

Gen3 evaluated the score-best claimant (64,8) per the predeclared score rule
and it failed fresh A-retention (`RSI_TASTE_GEN3_EVAL.md`). The v4 search also
produced exactly one config that was BOTH above Gen0 AND dual-true on search
retention: (capacity 32, recent 16), score 6.091 (`RSI_TASTE_SEARCH_WAVEA4B4.md`).
It was withheld under the score rule. Withholding it forever would waste the
one retention-shaped lead the program has found; evaluating it post-hoc as a
"second bite" without declaration would be cherry-picking. This line resolves
the dilemma by predeclaring, BEFORE running, a separate retention-first rule:

* Retention-first claimant rule (frozen here): from any completed search wave,
  the highest-score config with descriptive95Percent TRUE on BOTH skills may be
  fresh-evaluated as a retention-line claimant, independently of the
  score-best claimant. Each line's outcomes stand alone; a pass here counts as
  ONE accept in a new line (gen3's failure is not erased, successive counter
  remains 0 until two consecutive accepts occur in ANY single line — lines do
  not cross-credit).
* Multiple-comparison accounting: v4 now has TWO evaluated claimants
  (score-line (64,8): FAIL; retention-line (32,16): this eval). Both outcomes
  are reported; a retention-line pass is 1/2 in its line, not an RSI claim.

## Attempt (frozen)

* Config: Gen0-memory family, capacity 32, recent 16 (else identical).
* Fresh bank (new, never searched), 8 histories × 6 arms, 48 worlds, full v2
  gates + world-cap guard. Copy to both branches only on accept.
* Prediction (falsifiable): dual-true search retention generalizes to a fresh
  aRetention pass where the score-best failed. If it fails the same way, the
  v4 memory grid is closed as a bank-dependent lead and revisions suspend.

Evidence: `evidence/rsi-taste-v1/gen4-eval-20261030-v1/mem32-16-fresh/`.
