# RSI gen7 fresh eval: g=2 REJECTED on retention (successive 0/2)

> CORRECTION (2026-11-13): gate-(1) readings in the first version of this
> doc were a parsing artifact. True gate 1: seq +5.939 8/8 PASS (see
> `docs/RSI_FRESH_EVAL_CORRECTION.md`). Verdict stands, gate changes.

Config: Gen1 base R=4 + `surpriseGain=2`, W=0 (the v12 claimant; windows
proved silent). Fresh bank `gen7-eval-20261105-v1` (`ef3edf2b…`), 8 histories
× 6 arms = 48 worlds. One frozen attempt.

## Gate results

1. vs unlearned: mean EXACTLY 0.0, 0/8 positive (all eight paired diffs
   0.0) → FAIL (needs > 0, ≥6/8).
2. vs frozen-after-A: +1.504, 8/8, surv +53 → PASS.
3. vs reset-at-B/C: +4.945, 8/8 ≥ −1.00, surv +12 → PASS.
4. Skills: aSkill/bSkill/bAcq means > 0 (bAcq 1.19) → PASS.
5. Retention: aRetention +0.294 (6/8) pass; bRetention −0.052 (4/8) → FAIL
   (needs mean > 0). Descriptive B 1.53 vs 1.67 False.
6. Transfer: reset-tied 0.0, surv 0 → PASS.
7. Integrity: runner asserts held → PASS.

**REJECT on gate 5 only (bRetention −0.052, 4/8).** Gates 1–4 and 6 pass
(corrected: gate 1 was +5.939 8/8, not zero). Successive counter 0/2. No RSI.

Decomposition note: candidate == unlearned on every history yet beats
frozen-after-A by 1.5 — so the lifetime value of *continuing* on this bank
sits in the motor channel (frozen stops motor too), not the taste channel.
Taste-gain scheduling moved search-bank means but bought no fresh lifetime
over no-taste-learning. Within-phase plasticity scheduling is now exhausted
(single-step: washes out / bank-flips; windows: silent-or-saturate). The
A-leg needs its own representational resource — e.g. phase-indexed taste
structures keyed endogenously — or the program must report the boundary.

Evidence: `evidence/rsi-taste-v1/gen7-eval-20261105-v1/g2-fresh/`.
Round: v12 search 96 worlds (16 base + 64 A/B + 16 g2w0 control) + 48 eval.
Cumulative **2096 worlds**.
