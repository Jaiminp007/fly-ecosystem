# ADOPTABILITY AUDIT V1 — what predicts sandbox adoption (zero worlds)

Date: 2026-11-02. Analytic only (frozen C2–C10 rows + dev-results;
zero new worlds, no rescoring). Question: on which banks does the
5% sandbox bar pass at all? (Motivated by consecutive barren banks
463xxx/464xxx.)

## Adopted votes per line (proposals → adopted)

| Line | Eval | Proposals | Adopted (by menu) | Static-T1 (wound) | same |
|---|---|---|---|---|---|
| C2 | single gain | 96 | 17 (0:4, 1:13) | 0.955 (fresh) | 0.91 |
| C3 | single skip | 96 | 4 (3:3, 4:1) | 0.950 (fresh) | 0.90 |
| C4 | single skip | 96 | 5 (3:3, 4:2) | 0.289 (deep) | 0.89 |
| C5 | single gain | 96 | 13 (0:2, 1:11) | 0.342 (deep) | 0.91 |
| C6 | single surprise | 96 | 18 (6:18) | 0.312 (deep) | 0.90 |
| C7 | single surprise | 96 | 12 (6:12) | 0.409 | 0.94 |
| C8 | choice ×3 | 429 | 68 (1:31, 6:35, 4:2) | 0.289 (deep) | 0.90 |
| C9 | flip-choice ×3 | 432 | 0 | 0.253 (deepest) | 0.92 |
| C10 | flip+standard ×3 | 432 | 0 + 0 | 0.362 | 0.91 |

## Findings (descriptive only)

1. Wound depth does NOT predict adoptability: the deepest wound
   (C9 0.253) yields zero adoptions; a similar wound (C8 0.289)
   yields 68. Headroom ≠ passable bar.
2. same-val is flat (0.89–0.94) everywhere — no signal.
3. Flip-eval adopted nothing on its only bank; standard-eval adopted
   nothing on its only same-bank comparison (C10). Strictness
   ordering (flip > standard) is UNTESTED same-bank — C9 vs C8
   confounds eval with bank. Not claimed.
4. Barren banks (463xxx, 464xxx) are consecutive but unexplained by
   any stored observable (wound, same-val, survival, train gap all
   in normal ranges). Adoptability varies by bank for unknown
   reasons — the 5% bar binds on experience content, not on
   transfer need or headroom.

## Anti-screening clause

This audit must NOT be used to screen banks for adoptability (that
would be shopping: selecting evaluation conditions by expected
outcome). It is published to bound interpretation (barren banks are
normal-range banks where nothing passes) and to license the
standing question: what in retained experience makes an operator
pass the bar? (Unanswered; needs mechanism work, not re-runs.)

## Standing

- Zero worlds. No verdict changes. Cumulative unchanged (8331).
