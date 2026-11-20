# BRAKE-LIFT Plan V2 — replay-gated (or both-path) brake (FROZEN, design only)

Date frozen: 2026-10-26. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## New rationale (measured, not assumed — this is why V2 exists)

V1's INVALID was an instrument failure with a diagnosed mechanism, not
a hypothesis refutation:

1. Brake verified working in isolation (synthetic learner: hand-set
   brakes decay on live contact; decode path proven).
2. In full runs it never engaged meaningfully: end-weight cosine
   uniform↔brake = 0.83–0.98 (vs train↔uniform 0.61); nolift/slow/
   fast mutually identical to 4 decimals (decay irrelevant).
3. Cause measured: live:replay update ratio = 1:4 (fresh 500-tick run:
   1098 live vs 4392 replay). V1 gated ONLY the live path (~20% of
   updates); unbraked replay did the learning identically in all arms.
4. Conclusion: gate BOTH paths. Same brake, same init, same decay —
   applied wherever tasteUpdate runs.

Without (1)–(3) this would be an automatic V2 (not licensed). With
them it is a new rationale: the gated pathway changes.

## Changes vs V1 (minimal diff, everything else identical)

- Engine: move the brake block outside the `mode==='live'` gate so it
  applies to live AND replay updates (same billing, same counters,
  same null-default behavior when assocBrake is off — re-verified by
  the implement turn's bit-identity fixture, extended to replay mode).
- Decay semantics: per-UPDATE (either mode) with UNCHANGED constants
  (nolift 0 / slow 0.0007 / fast 0.0035 — meaning shifts from
  per-contact to per-update; documented, not re-tuned).
- Init unchanged (post-transplant, min(0.8, trainContacts/2000));
  transplant/snapshot/integrity unchanged; collector unchanged
  (per-cue thirds + firstTick standard); scorer unchanged (G1/G0/G2b
  + manipulation ≥0.05 + lift ≥+0.1 on ≥2/3 + LI descriptive);
  verdict set unchanged (BRAKE-GO-V2 / NOGO / INVALID / INCOMPLETE).
- Arms identical (train + uniform + 3 brake doses + unlearned = 18).

## Bank, caps

- Bank `evidence/brake-lift-dev/fresh-02/`: 6 histories 424001–424054
  (same 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  424xxx verified 2026-10-26: zero exact-seed hits, zero registry hits;
  the only token hits are float substrings + one synthetic test seed
  (424242), all outside the drawn set (harmless per standing
  precedent). Builder re-verifies at build; post-build refusal guard.
- Caps identical to V1: 18/0/32256/774144/5e9 ops. No new finiteness
  risk (brake is bounded scaling; replay-path application verified in
  fixtures on synthetic histories).

## Verdicts and closure

GO-V2 iff manipulation (nolift < uniform by ≥0.05) AND lift (fast >
uniform by ≥+0.1 on ≥2/3 pairs) — i.e., the V1 bars, now on a brake
that can actually bite. A GO-V2 confirms the associability mechanism
(brake + release accounting for the LI gradient); follow-up dose-of-
release freeze licensed, not executed. NOGO/INVALID/INCOMPLETE per
V1 logic. The line closes with its verdict either way. No V3 without
a new rationale. Single attempt, cumulative +18. No RSI claim.
