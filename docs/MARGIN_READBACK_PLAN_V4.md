# Margin-readback repair plan V4 (D1-FIX acceptance by recomputation)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized application only. V1/V2/V3 preserved untouched (all NO-GO
per their computed verdicts) — this is a NEW frozen acceptance act, not a
rescore, not a second run under any prior plan.

## Why V4, and why recomputation (not a re-run)

Attempt-03's ledgered evidence satisfies every V3 bar (RESULTS_V3 table);
the computed `go:false` traces to exactly ONE broken field reference
(`re.meanMargin` on a live collector entry that carries `marginSum` —
`undefined→NaN→false`). All other bar expressions reference real fields and
stand as computed. A re-run would measure nothing new (instrument and bars
unchanged in content) while spending ~18 executions and fresh seeds/rows for
zero evidential gain. Recomputation spends ZERO worlds and ZERO seeds,
duplicates no run, and cannot tune anything (measurements frozen in
attempt-03 before this plan existed).

Rescoring distinction (explicit): this does NOT re-analyze data on judgment
grounds. It mechanically evaluates the FROZEN V3 formulas against the FROZEN
attempt-03 ledger, correcting only the field path to what the plan meant
(the probe's mean margin, ledgered as `meanMargin` in the same run's
`summaries`). The formula, tolerances, and evidence are all fixed beforehand.

## Procedure (zero worlds, zero seeds, zero engine runs)

New script `scripts/margin-readback-recompute.mjs` (assertion-based; any
mismatch throws, no partial pass):

1. Read attempt-03 `synthetic.json` / `spent-bank.json` / `ledger.json` /
   `attempt.json`. Assert byte-presence of all four + `plan` field of
   `attempt.json` is the V3 plan.
2. Recompute from LEDGERED summaries:
   - G1: `withEmit.perProbe['A:current']`: n===1024, events===n, bad===0,
     phiLength===96.
   - G2pos: `reset.perProbe['A:reset']`: survivors===4 (ledger `reset`
     section), n===1024, bad===0, minMargin===maxMargin,
     |meanMargin−0.25|≤1e-9.
   - G3: dOps = withEmit.ops − noEmit.ops === 1024×(2+96);
     |Δvalue + dOps×operationEnergy/4| ≤ 1e-6 (operationEnergy from
     `scripts/body-transfer.mjs` BT_PRICING, same constant the run used);
     survivors equal.
   - G4: all 5 spent keys n>0, bad===0; anchorDigestBefore===anchorDigestAfter;
     history===604620731.
   - Caps: ledger executions≤32, worldTicks≤100e3, founderSlots≤1e6,
     scalarOperations≤1e9.
3. Carry (with stated trust chain, NOT re-derivable from the ledger — the run
   retained only the boolean):
   - G2neg: `attempt.json` verdict G2neg===true. Trust chain: the expression
     (`seen>0 && events===0 && n===0`) references only real collector fields;
     `scripts/margin-readback-check.mjs` sets the flag only behind
     `config`-presence (guarded); fixture test 5 pins the `seen`-without-
     margins semantics for decision-only streams; G2neg passed on live objects
     with no undefined-field involvement (all three fields exist on every
     perProbe entry by construction).
   - G5: full-suite triage already recorded (515 tests, 6 pre-existing).
4. Write `evidence/margin-readback/attempt-04/recomputation.json`
   (`{plan, sources, clauses:{...}, go}`) — the ONLY new artifact. No engine
   execution, no seeds, no bank contact of any kind.
5. Conjunctive accept: ALL recomputed clauses true AND all carried clauses
   true AND caps hold → `go:true` → **the D1 repair is ACCEPTED**.
   Any failure → V4 NO-GO, D1-FIX closes, D1 remains the documented blocker.

## Not included (unchanged)

No engine runs, no seeds (fresh or spent), no bank draws, no qual/dev bank,
no learner revision, no intervention effect, no H2, no ELSEWHERE sensing, no
RSI, no Option B, no rescoring of attempts 01–03 (their computed verdicts
stand), no second V4 application. On GO: the repair is ACCEPTED and a
margin-gated follow-up may be PROPOSED under its own frozen plan — no worlds
for it here.
