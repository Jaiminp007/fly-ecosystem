# RSI C3 PLAN V1 (internal loop, selection operators) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: C2 bounded NOGO (menu 0–1 exhausted: plain gain does nothing;
menu 2–5 untried) + replay synthesis (SELECTION works, amplification
doesn't; skip ≡ surprise-mirror, novel mechanism) + C1/C2 machinery
(frozen, implemented, triaged). This plan covers implementation
(same wire + adapted instrument + fixtures + triage) AND the single
execution (bank + attempt-01 + verdict), C2-verbatim except the
differences below.

## Differences from C2 (everything else identical)

- **Menu indices (role-assigned): train→3 (skip 0.05), T1→4 (skip 0.1).**
  Rationale: the SELECTION family (untried by the loop; skip drops
  low-error records ≈ surprise-boost amplifies high-error ones —
  mirror mechanism, genuinely new test, not a V1h re-run).
- **Shrink (idx 5) EXCLUDED with reason.** Shrink is a one-shot weight
  action, not a config: fresh-run T1/T2 agents (zero weights) cannot
  inherit it (0×0.25=0). Carrying shrink needs transplant carryover
  (V1m machinery), which re-entangles weight transfer with operator
  transfer — out of scope (documented constraint, not an oversight).
- **Gain 2.0 (idx 2) deprioritized honestly.** Plain amplification failed
  twice (0.5, 1.0); 2.0 tests the same null. Left untried, named here.
- **Fresh-19 bank** `evidence/rsi-c3-dev/fresh-19/`, same 9-schema,
  6 histories × 9, range **457001–457054**. VERIFIED clean 2026-11-02
  (zero hits docs/scripts/tests/learning/engine pre-freeze; sketch
  never mentioned it; evidence exact-int scan by the builder at build,
  fail-closed). attempt-01 + fresh-19 verified free pre-freeze.
  Builder re-verifies; fixture-seeds after build; post-bank refusal;
  union-excluded (spent through 456xxx + own 457001–457054 appended).

## Unchanged from C2 (C2-verbatim, machinery proven)

Seg-chain successive (2 chains × 10 runs = 20 mains, 0 probes); looper/
static/copied + unlearned tags; proposal tick {1024}; lifetime structural
(1 per run); temporal sandbox split; majority-vote carryover; flip-split
HB scorer (imported frozen V1m); G1/G0/G2a (successive +0.1 ×2 +
non-decrease)/G2b (looper−copied>0)/G2c/G2d; verdicts C3-GO/C3-NOGO/
C3-INVALID/C3-INCOMPLETE-UNTRAINED. Caps 20/0/35840/860160/4.0e9/10800s.
14 fixtures. ONE authorized attempt (attempt-01). `redone: []` expected.

## What GO/NOGO mean (bars unmoved)

- GO-C3: ≥2 successive live accepts + productivity vs copied-improvement
  (the separately-satisfying evidence) → RSI CLAIM licensed.
- NOGO (flat): selection operators adopted but don't transfer (proxy
  failure again, or skip≠boost after all — informative either way).
- NOGO (reject): sandbox rejects skips (train-error says no) → line
  closes with the sandbox's verdict (loop correctly finds nothing).
