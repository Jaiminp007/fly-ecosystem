# ODOR DEV ROUND 2 PLAN V1 — FROZEN 2026-11-02 (interleaved A-rehearsal)

Status: FROZEN. Authorizes exactly one implementation matching this
plan verbatim, fixtures, triage (read-only round-1 reuse check), and
single round-2 execution on the SAME 8 reused histories. No fresh
bank (bank protection holds — dev uses no new seeds). No second run,
no tuning, no qual claim. Zero worlds spent by this freeze.

## 1. Schedule (frozen)

Six slots, 1792 ticks total (SAME budget as round 1):
A256 – B512 – A128 – C512 – A128 – D256.
B/C/D masses identical to round 1; A split 512 → 256+128+128.
A-first preserved; ends in D (transfer probes from D state).
Phase→resource-seed map (frozen): [0,1,0,2,0,3] — A-revisits reuse
`history.resourceSeeds[0]` (literal re-exposure, same geometry).

## 2. Instrument change contract (exact)

- New export `CONTINUAL_PHASES_REHEARSAL` (6 entries): A/B/A/C/A/D
  with kinds/nutrients/shiftEvery mirroring round 1 per phase type
  (A-slots: kind 'stable', nutrient .4, shiftEvery 0).
- Generalize the 4-phase hardcodes: `phaseIndex<4` → table length;
  anchor key per slot (final A-slot designated THE 'A' anchor for
  frozen probes; keep all six slots for audit).
- Dev-script curriculum flag selecting the rehearsal table for the
  new arm only. Probe forks unchanged (256-tick).
- Fixtures (all green before execution): slot order + tick sum 1792;
  anchor keys incl. final-A designation; seed map [0,1,0,2,0,3];
  no new seeds referenced anywhere (bank-safety assert).

## 3. Arms and probes (8 reused histories)

- Acquisition (NEW, one arm): learned-interleaved (continuous
  training regime, learned steering — identical to round-1 learned
  except the phase table).
- Reused read-only (no re-spend): round-1 learned/native/guarded/
  frozen/reset acquisition rows as the fixed-curriculum baseline.
- Probes (NEW, from the interleaved D anchor + slot anchors):
  A earlier/current/reset (A-retention; earlier = final-A anchor),
  B earlier/current/reset (guardrail), transfer current/reset/native/
  guarded/native-full (same 5 modes, same transfer seeds).
- Retention arithmetic + transfer comparisons identical to round 1
  (same scorer code path).

## 4. Caps (from round-1 archived actuals × margin)

Round-1 actuals (read-only tar extract): total 35.66e9 ops
(acquisition ~2.4e9/arm; probes A 7.2e9 + B 7.2e9 + transfer 9.5e9);
wall 197s. Round-2 estimate: 1 acquisition (~2.4e9) + full probe
suite (~23.9e9) ≈ 26.3e9. Frozen caps: aggregate ops 40e9, wall
3600s, 8 histories (reused — spend is compute, not seeds).

## 5. Gates and verdict (frozen, from scoping #5)

- Transfer gate (unchanged): +mean vs reset AND vs cheap
  native-full, ≥6/8 histories positive each, nonnegative survivor
  diffs on both.
- A-retention ≥ 95% (saved-over-reset with support, same rule).
- B guardrail ≥ 95% (stricter than round 1 by design).
- GO iff transfer + A + B. PARTIAL if transfer + A pass but B < 95%
  (round 3 must protect B). Else NO-GO (rehearsal hypothesis closed;
  round 3 = guard-feature). Descriptive dev verdicts, not qual.

## 6. Record

Results doc + status whatever the verdict; round-1 archive
untouched; cumulative dev spend added to ledgers. A GO triggers
qual-freeze consideration (iv-b) — it does NOT authorize qual.
