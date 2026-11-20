# R-GAP plan amendment V1b (bias-corrected recomputation, zero new worlds)

Frozen 2026-10-29, BEFORE any recomputation. Single authorized application only.
V1 verdict (INVALID-BILLING) STANDS UNTOUCHED — this is a NEW measurement on
the frozen ledger, not an overwrite (D1-FIX V4 precedent: correct the formula,
recompute mechanically, duplicate nothing).

## Why (diagnosed read-only; the guard did its job)

V1's raw gap conflates discrimination with pause-bias. Post-verdict inspection
of the ledgered rows shows S1 transfer gaps 0.3–3.8, all trained<reset
(consistent sign): shared/appetite policies pause in the cue-free ecology
while zeroed cruises. Reset/current probes from one anchor differ ONLY in
weights (verified: reset preserves charge/billing/memory is equalized by
compact on both sides; eligibility zeroed both sides) — so S1's transfer gap
is 100% behavioral pause-bias, and A/B gaps mix bias with discrimination.
The transfer guard fired correctly; the formula, not the run, was defective.

## Correction (frozen formula; applied mechanically, no judgment)

gap_disc[config][history][family∈{A,B}] =
  |current − reset|_family − |current − reset|_transfer   (paired, same anchor)
Aggregate: mean over 6 histories; best = max non-control config mean;
GO iff best − control ≥ +0.5 (same bar). Rationale on record: transfer gap
measures the config's pause-bias where NOTHING can be discriminated
(cue-free); subtracting removes it to first order. Assumption stated plainly:
bias is ecology-independent in magnitude; if wrong, the correction
under/over-shoots — the sign-consistency check below bounds this risk.

## Guards (replacing V1's G2 tripwire for this recomputation)

- G2′ transfer sanity: every per-history |dT| ≤ 5.0 (all observed ≤ 3.78).
  Breach → INVALID-CORRUPT (data, not science, is broken). The old tripwire
  is RETIRED for V1b (its job — discovering the confound — is done; transfer
  is now a correction term, not a veto).
- G2″ sign consistency (new): the winning config's per-history signed A/B
  gaps must be ≥ 0 in ≥ 4/6 histories (trained must TEND to beat zeroed, not
  just differ). A config that wins on absolute gaps while trained mostly
  LOSES is pause-bias in the opposite direction → NOGO (fail-closed).
- G4 baseline sanity UNCHANGED (control raw mean ∈ [0.5, 2.5]).
- S2/S3/control recomputed under the same formula (their transfer gaps are
  exactly 0.0, so correction is provably neutral there — built-in sanity:
  any movement = script bug → INVALID).

## Procedure (zero new worlds, zero bank contact)

New scorer `scoreRGapV1b(rows)` + fixture tests (GO / NOGO / INVALID-sanity /
sign-inconsistency branches) green BEFORE application; `node --check` clean.
Application reads ONLY `evidence/r-gap-dev/attempt-01/{rows,anchors,ledger}.json`
+ attempt.json (plan-ref check); writes ONLY `dev-results-v1b.json`
(sources recorded; NEVER touches dev-results.json, ledger, rows, anchors).
No engine runs, no seeds, no bank draws.

## Not included (unchanged)

No new worlds/probes (the ledger is complete); no rescoring of V1 (it stands);
no second V1b application. IF V1b GO: Phase B authorized — frozen separately
as V1c (second generation + copy-control + matched budget, fresh bank).
V1b GO is a search hit, never an RSI claim (original bar restated).
