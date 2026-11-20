# ADOPTABILITY AUDIT V2 (C11–C13 votes, read-only)

Date: 2026-11-02. Zero worlds. Extends ADOPTABILITY AUDIT V1
(C2 17 → C8 68 → C9/C10 0).

## Rates (adopted/votes; votes lack tick — first/second fire
cannot be split, disclosed)

- C11 looper: 26/144 (18%). Copier: 0 votes (blind, no eval).
- C12 looper: 26/144 (18%). Copier: 0 votes.
- C13 single: 32/144 (22%). Double: 116/282 (41%).
- C13 legs stable: double 44/36/36 (train/T1/T2), single
  9/10/13. No collapse, no explosion.

## Readings

1. **The loop is not barren.** C11–C13 adopt 18–41% of
   evaluations (148/426 in C13). The C9/C10 zeros were
   eval-design artifacts (flip ran 72 proposals/row with zero
   adopts; bank-null), not loop death. Adoptability is healthy;
   TRANSFERABILITY is what's absent — selection isn't the
   bottleneck, the operators' transfer is.
2. **Double adopts ~2× single (41% vs 22%)** on identical
   construction/menu/histories. The difference must be
   EXPERIENCE (second fire sees post-first-adoption runs; first
   fire sees 512-tick records). Ambiguity recorded, not resolved:
   self-reinforcement (the loop's changes make later evals pass
   more) vs timing (512- vs 1024-record evals differ). No
   tick-per-proposal in stored votes → cannot split. This becomes
   an instrumentation requirement for any future freeze (with the
   {incErr,candErr} requirement): record tick + errors per vote.
3. **C13's +0.030 comes from an adopting arm.** The second-fire
   value is not vacuous-unanimous (contrast C7's +0.0001, C10's
   +0.0275): the arm adopts heavily and still only gains +0.03.
   Revision is active and small — the honest middle between
   "loop does nothing" and "loop works".

## Nothing reopens

Adoptability health does not move any NOGO (all verdicts gated on
transfer, which stays null). The audit sharpens the mechanism
picture only.
