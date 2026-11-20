# ADOPTABILITY AUDIT V3 (C14 votes, read-only)

Date: 2026-11-02. Zero worlds. Extends V1 (C2 17 → C8 68 →
C9/C10 0) + V2 (C11/C12 18%, C13 single 22% / double 41%).

## Rates (adopted/votes; first line with tick-per-vote + errors)

- C14 sparse: train 15/48 (31%) → T1 9/48 (19%) → T2 4/45 (9%).
  Overall 28/141 (20%).
- C14 copied: 0 votes (blind by design — no eval, no proposals).

## Reading

1. **Adoption declines as transfer proceeds.** The sandbox passes
   less on transferred weights (31%→19%→9%). The loop senses the
   wound (pass rate tracks it) but cannot fix it (transfer null).
   First leg-dependent adoption trend in the program — visible
   ONLY because tick-per-vote shipped (C14 was the "next freeze"
   that paid the OPEN CELLS debt; the debt is now repaid).
2. **Adoptability ≠ transferability, reinforced.** 20% overall is
   healthy loop activity (V2's finding extends); transfer stays
   null. The bottleneck is downstream of adoption, again.
3. **Blind carries no votes by construction.** Copied rows adopt
   the config with zero evals — the dose-match is exact on votes
   too (nothing to compare), which is why G2b reads as selection
   value, not adoption difference.

## Addendum 2026-11-02 (fee confound ruled out, read-only C14 votes)

Adopted votes (n=28) mean fee 1079.5 vs rejected (n=113) mean fee
1063.0 — essentially identical. Adoption does NOT track evaluation
size: the 5% bar isn't easier on smaller evals, so the train→T2
decline is about the weights/experience, not an eval-size artifact.
The decline reading stands unconfounded.

## Nothing reopens

V1/V2 stand; C14-NOGO stands. The audit sharpens the mechanism
picture only (the loop sees the wound in its pass rate).
