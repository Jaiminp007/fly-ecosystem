# ODOR DEV ROUND 6 PLAN V1 — FROZEN 2026-11-02 (soft-gated mixture)

Status: FROZEN. Authorizes exactly one implementation matching this
plan verbatim, fixtures, triage (read-only round-1/3/5 reuse check),
and single execution on the SAME 8 reused histories. No fresh bank.
No second run, no tuning, no qual claim. Zero worlds spent by this
freeze. Parent: ROUND6 SCOPING V1 (one divergence recorded below).

## 1. Design (single-variable vs B1)

B1 = one learning branch (go, viable ticks) + forced stop + no
update while stopped. B2 = hard-switched mixture of TWO learning
experts: go-branch updates on viable ticks, stop-branch updates on
!viable ticks (same TD formula, same rate/bounds/clip as the live
rule), action = argmax of the active branch. The ONLY differences
vs B1: (a) stopped ticks generate updates (stop-branch, in-regime),
(b) stopped action = stop-branch argmax instead of forced 0.

DIVERGENCE from scoping (documented, frozen here): the scoping
sketch proposed a sigmoid blend with frozen k/theta. Viability is
binary, which leaves k/theta under-identified (any steep sigmoid
reduces to two constants), and blending against B1's fixed-zero
stop branch is vacuous (argmax(0.5*go) = argmax(go)). The frozen
form keeps the scoping's PRINCIPLE (stop shapes behavior without
consuming learning) in the identifiable mechanism: per-regime
experts. If B2 fails, the failure attaches to the mixture form,
not to unidentified constants.

## 2. Instrument contract

- New module (soft-gated head; B1's module + fixtures untouched —
  negative preservation). Branch weights in `state.steering.weights`
  shape {go, stop}; fork/validate/freeze/reset generalized (same
  pattern as R3/R5).
- Experiment learner key `soft-gated` (null-default: all legacy
  paths bit-identical).
- Billing: decision 2 branches + 9 (same 89 as B1); update 139 on
  whichever branch resolves (same formula); no blend ops (hard
  action switch).

## 3. Arms and probes (8 reused histories)

- Acquisition (NEW, one arm): learned-soft-gated (continuous
  regime, fixed curriculum).
- Reused read-only: R1-learned, R3-learned-guard, R5-learned-gated,
  guarded, frozen, reset rows (clean ladder: input / behavior /
  hard-arch / soft-arch vs guard).
- Probes: A/B earlier-current-reset + transfer 5 modes from the B2
  D anchor (same seeds, same scorer code path).

## 4. Caps

R5 actual 27.03e9 → frozen caps 40e9 ops, 3600s wall.

## 5. Fixtures (all green before execution)

Gate switches action by branch (viable->go argmax, !viable->stop
argmax); stop learns on !viable (weights move, updates counted);
go learns on viable; no starvation (stopped ticks resolve updates);
stop does NOT update on viable ticks (regime separation); billing
identity (89/decision + 139/update either branch); anchor keys;
no-new-seeds; scorer reuse (same gates code path).

## 6. Verdict (frozen)

- GO iff transfer gate (6/8 vs reset AND vs cheap native-full,
  nonnegative survivor diffs) AND A>=95% AND B>=95% AND
  beat-guarded (>=6/8 positive, mean>=0).
- PARTIAL iff transfer+A+B pass but guarded fails.
- Else NO-GO per the scoping's three-branch falsifier:
  recover-A-but-lose closes the gating family (B3 next); fail-A-too
  closes B2 without B3-on-gating; win triggers qual consideration.
- Descriptive dev verdicts in all cases.
