# RSI C17 RESULTS V1 — INVALID (freeze deviation, material)

Attempt-01 executed 2026-11-02 on fresh bank 472001–472054 (fresh-33):
15/15 mains, 0 probe executions (inline), 26880 ticks, 645120
founder-slots, 2.461589418e9 scalar ops (cap 5.0e9 ✓), wall within
10800s ✓. `redone` lists 13 resume-executions across two crash-resumes
(fixes 2+3, both committed, fixtures 16/16 before each relaunch);
`executionSources ≠ scoringSources` (fix 3 landed mid-attempt),
dual provenance disclosed exactly per the C16 precedent.

## Verdict: C17-INVALID (implementation did not match the freeze)

The frozen plan §3.5 specifies retain-iff **post-rate > pre-rate**.
The implementation compared **counts** (`post > pre` in `closeOut`).
Post-hoc rate reconstruction from recorded trigger ticks and leg
length (BT_TICKS=1792, read-only on attempt rows, zero new worlds):

- 4 of 10 indexed reassignments would have REVERTED under the frozen
  rate rule (472010 cue 2/4, 472028 cue 2, 472046 cue 6 — all
  early-trigger, thin-evidence cases where tiny pre-windows inflated
  pre-rates). The count rule retained all 10.
- The deviation is therefore MATERIAL: the administered treatment
  (persist-all) differs from the frozen treatment (revert-4). The
  gates assume the frozen treatment, so no GO/NOGO can certify the
  plan. Fail-closed → INVALID. Line CLOSED; bank 472001–472054 spent
  (future builders must union-exclude it).

## Descriptive numbers (evidence, not a verdict on the plan)

| gate | value | bar | status |
|---|---|---|---|
| G0 applicability (fired ≥1) | 10 firings / 6 legs | ≥1 | met |
| G1 HB indexed − exact | 0.2556 − 0.4186 = −0.163 | > +0.10 | miss (wrong direction) |
| G2 BH exclusivity | |0.7608 − 0.7984| = 0.038 | ≤ 0.07 | held |
| G3 shuffled − exact | 0.1993 − 0.4186 = −0.219 | ≤ +0.03 | held (null-or-worse) |
| BH floor | 0.7608 | ≥ 0.7 | held |
| train retention / unlearned validity | gaps pass | — | held |

All gate margins are far from boundaries (nearest: G2 0.038 vs 0.07)
— the INVALID is procedural, not a boundary judgment call.
probeOps 436–581k/leg, billed inline; coincide flags mixed (A1
aliasing occurred as permitted); exact-arm HB 0.42 replicates the
wound direction on a fresh bank (V1m exact 0.29 — bank variation).

## Lessons recorded (for any successor licensing)

1. **Rate-normalize evidence gates.** Count-rules over unequal windows
   retain near-automatically (10/10 here). Any successor with a
   retain/revert rule must compare rates over explicit windows —
   and pre-register the window convention (early-trigger thin
   evidence is exactly where the rules diverge).
2. **The descriptive direction is hostile, not null.** Both
   reassignment arms underperformed exact (−0.163/−0.219) with BH
   flat — reassignment to min-turn surrogates, including coincided
   live patterns, disrupted rather than rescued. A corrected
   rate-rule re-run is NOT licensed by this: the bank is spent and a
   different treatment needs a new number with a genuinely-new
   rationale, not a bugfix re-run.
3. **Mid-cycle probe lesson stands** (fixes 2+3): observation-flag and
   bookkeeping invariants legitimately fail mid-cycle; feedforward
   probes must use cycle-free state (config + weight snapshot +
   balance), never compact/restore of live-cycle state.

## Cumulative

C-series now 16 lines, 313 mains (298 + 15), ~51.9e9 ops. Zero accepts
remain zero. The input-side locus stays open (one mechanism closed
procedurally, none tested cleanly); the C17-bar still stands for a
genuinely-new input-side rationale.
