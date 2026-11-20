# BRAKE-LIFT Results V1 — INVALID (brake doesn't bite: live-only gating swamped by replay)

Date: 2026-10-26. Plan: `docs/BRAKE_LIFT_PLAN_V1.md` (no amendments).
Bank: `evidence/brake-lift-dev/fresh-01/` (6 histories, 423001–423054).
Evidence: `evidence/brake-lift-dev/attempt-01/`. Single attempt, 18/18
mains, `redone: []`, corrected ledger 18/0/32256/774144/2.92e9
(rescored 2026-10-26: note() copy-paste swapped worldTicks/
founderSlots formulas; recomputed from frozen row endpoints, ops
identical; zero new worlds).

## Verdict: INVALID (manipulation gate fails; no license)

- **G1 integrity ✓** — 18/18 complete, join ≥ 0.99, ledger exact
  (post-correction).
- **G0 train-learned ✓** — train gaps 0.82/0.81/0.81 (V1 reference
  intact again).
- **G2b unlearned flat ✓**; null-hygiene clean (all null arms zero,
  all brake arms fired); brakeUpdates counted (3101 on nolift).
- **G-manipulation FAILS** — nolift HB 0.309 vs uniform 0.330:
  difference −0.021 < 0.05 bar → INVALID (per frozen rule: the
  construct doesn't bite, so no lift inference). Fast arm 0.306
  (BELOW uniform — directionally consistent with a brake that only
  drags). Per-pair HB: uniform [0.46,0.23,0.30], nolift
  [0.45,0.22,0.26], fast [0.45,0.22,0.25] — brake arms track
  uniform almost exactly.

## Autopsy: verified-working brake, wrong pathway (read-only + unit proofs)

1. **Instrument verified**: brakeInit correct (12 cues, 0.69–0.8);
   flags reach state; brakeUpdates>0; fixtures 10/10 incl.
   bit-identity.
2. **Mechanism verified in isolation**: synthetic learner with
   hand-set brakes decays on live contact (decode works; 1 cue hit
   in 200 fresh-world ticks).
3. **But in full runs it's a drop in the ocean**: end-weight cosine
   uniform↔brake = 0.83–0.98 (vs train→uniform 0.61) — brake arms
   land essentially where uniform lands; nolift/slow/fast are
   mutually identical to 4 decimals (0.9812 = 0.9812). Decay speed
   doesn't matter because the gated path doesn't matter.
4. **Why: live-only gating.** The brake gates live updates; replay
   runs unbraked. Fresh measurement: 500-tick run gives 1098 live vs
   4392 replay updates (4:1; the V1c-era 160:1 figure counted
   differently, but either way replay dominates). A 5× cut to ~20%
   of updates shifts total learning ~10% — below the gate, and
   cosine-insensitive (same direction, slightly behind).

The plan's INVALID path anticipated exactly this class of outcome
("construct doesn't bite → INVALID, not NOGO"): the LI-brake
HYPOTHESIS is not refuted — the INSTRUMENT gated the wrong pathway.
Specified next (not executed): replay-gated (or both-path) brake —
gate the effective rate in tasteUpdate regardless of mode. That is a
new instrument (new rationale), not a V2.

LI gradients (descriptive, inconclusive): uniform −0.453 (stronger
than the historical −0.17 — bank variance in LI itself); brake arms
+0.15–0.17 (sign-flipped). With the brake provably near-impotent in
these runs, the flip is uninterpretable (partial-r on ~20 cues,
CI spans zero); recorded, not claimed.

Cumulative 7647 + 18 = 7665 (+18 ledgered; per-line authoritative).
No RSI claim.
