# ODOR QUAL READINESS V1 (lane study, read-only) — NOT READY

Date: 2026-11-02. Zero worlds. Read all four odor dev docs
(plan/results/motor-freeze/audit). Question: can Path A (odor-qual
line for DTR part iv) freeze now? Answer: NO — dev gates unmet.

## Findings (their own words)

- Transfer consistency gate FAILS on 8 reused histories: +0.42
  vs reset but 5/8 histories (< 6/8 bar); +0.36 vs cheap
  native-full, 5/8; −0.55 vs guarded, 0/8 positive.
- Retention: A 22.48% (FAILS the 95% requirement); B 179% (cannot
  offset A or transfer failures — their words).
- Survivors thin: learned 20/192 founders at end of curriculum.
- Motor-freeze helps vs continuous (+7.43, 8/8) but barely vs
  frozen-A (+0.30, 3/8) — survival via stopped exploration, not
  proven skill. Follow-ons re-test the same gates on the same
  reused histories (even passing ≠ qualification — their words).
- Engineering audit covers fixtures/implementation ONLY; explicitly
  establishes nothing about population support, skills, survival,
  retention, transfer, or improvement.

## Readiness verdict: NOT READY (4 unmet preconditions)

1. Transfer gate fails (5/8, 5/8, 0/8).
2. A-retention 22% vs 95% bar.
3. Learned survivors 20/192 (thin base for a qual claim).
4. No fresh bank drawn (dev used 8 reused histories; qual needs
   fresh 54 + TASTE-style frozen plan).

## Recommendation (recorded, not executed)

Another DEVELOPMENT round first (fix transfer + A-retention on
reused histories); qual freeze only after dev gates pass. This
protects a fresh bank from a predicted-fail spend (same logic as
threat-in-transfer parking: don't spend banks on known-failing
configurations). DTR part (iv) Path A waits on odor dev, not on
paperwork — the blocker moved one level down (iv-a: odor dev
gates; iv-b: qual freeze).
