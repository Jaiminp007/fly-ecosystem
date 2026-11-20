# ODOR DEV ROUND 5 SCOPING V1 — gated-pair steering (NOT FROZEN)

Date: 2026-11-02. Zero worlds. Status: SCOPED (mechanism + falsifier
+ decomposition recorded; open items listed; no license, no bank, no
code, no execution). Promoted by round-4 NO-GO (frozen falsifier:
ARCHITECTURE, not signal). Design: NONLINEAR_HEAD_DESIGN_V1 (B1
default).

## Mechanism

B1 (gated pair): two 2×10 linear heads (go/stop branches), hard
switch on the computed `guard.viable`: viable → argmax(go·phi);
else forced stop with NO learning update on either branch (the stop
is a gate, not a policy — no starvation question by construction).
The go branch learns from environmental reward with the live delta
rule (same as R1/R3). R1 10-dim features (guard channels included).

## Why this decomposes the failures cleanly

- R3 (10-dim, learned stop) failed → the learner doesn't USE the
  viability input to stop correctly.
- R4 (BC of guarded) failed → the signal doesn't transfer the
  stop policy either.
- B1 FORCES the stop: if B1 still loses to guarded, even perfect
  stopping doesn't save the go-policy — the gap is go-quality, and
  the B family closes (B2/B3 address expressiveness, not gating).
  If B1 wins, the gap was stop-correctness all along, and R3/R4
  failed on the learnability of stopping, not its value.
- Single-variable vs R3-learned-guard: identical inputs, identical
  go-branch learning; the ONLY difference is forced-vs-learned
  stop. The cleanest comparison in the lane so far.

## Falsifier (pre-registered)

Transfer gate + retentions vs guarded bar (below): B1 must BEAT
guarded (it internalizes the guard's stop — matching it would mean
the go-branch adds nothing). Losing to guarded with a forced stop
in place = architecture closed, promote B2.

## Verdict mapping (frozen at plan time, proposed here)

GO iff transfer gate (6/8 vs reset AND vs cheap native-full,
nonnegative survivor diffs) AND A≥95% AND B≥95% AND
beat-guarded (≥6/8 positive, mean≥0). PARTIAL iff transfer+A+B
pass but guarded fails. Else NO-GO (B1 closed → B2 threshold
units scoped next; B3 last resort).

## Open items before a frozen dev plan

1. Branch learning rule exact form (live delta on go-branch only?
   confirm no-update-on-stop doesn't break the update bookkeeping).
2. Instrument change list (gated head module; fork/validate/freeze/
   reset generalization — same pattern as R3 dim work).
3. Arms (B1-learned only + full probes; comparators R1/R3/guard
   reused read-only) + caps (40e9/3600s, same basis as R3/R4).
4. Fixtures (gate switches correctly; stop-branch frozen;
   go-branch learns; billing identity; no-new-seeds).

## What this is not

Not frozen, not authorized. B2/B3 stay queued behind B1's
falsifier. The DTR trunk track proceeds independently.
