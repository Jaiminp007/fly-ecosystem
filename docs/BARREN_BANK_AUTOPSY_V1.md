# BARREN-BANK AUTOPSY V1 — INCONCLUSIVE-as-recorded (zero worlds)

Date: 2026-11-02. Analytic only (frozen C8/C9/C10 train rows; zero
new worlds). Question (from ADOPTABILITY_AUDIT_V1): what in retained
experience makes an operator pass the 5% bar? Compare the adopting
bank (C8, 68 votes) against barren banks (C9/C10, 0 votes) on stored
observables.

## Stored observables do not discriminate

| Bank | Adopted | joinRate | harmShare | decisions | survivors |
|---|---|---|---|---|---|
| C8 (adopting) | 68 | 1.0 | 0.28–0.32 | ~40–41k | 12 |
| C9 (barren) | 0 | 1.0 | 0.29–0.32 | ~40–41k | 12–14 |
| C10 (barren) | 0 | 1.0 | 0.31–0.36 | ~39–40k | 6–9 |

C9 matches C8 on every stored observable yet adopts nothing.
C10's lower survivors (6–9 vs 12–14) is the sole visible difference,
but C9 refutes survival as the explanation. harmShare, decisions,
joinRate all sit in identical ranges. Barrenness is invisible in
everything the rows store.

## Why: the sandbox inputs aren't stored

Adoption depends on retained RECORDS (phi diversity, target balance,
surprise levels in recent/older buffers) — none stored in rows.
Worse, the votes don't even store ERRORS (incErr/candErr per
proposal): we cannot tell whether barren banks were near-misses
(all proposals at 0.96×incumbent) or far (all at 1.5×). The audit
trail ends at adopted:true/false.

## Requirement (any future line that wants adoptability diagnostics)

- Votes carry errors: {menuIndex, adopted, incErr, candErr, fee}.
  (Plain data, already computed in evalRec; just persist it.)
- Optionally: store sandbox fit/test record counts + target balance
  per evaluation (cheap summaries, no full records).
- With errors stored, a future audit can separate near-miss banks
  (bar too strict?) from far banks (experience too poor?) — the
  distinction this autopsy cannot make.
- This is instrumentation, not a verdict change: no rescoring, no
  re-runs, C9/C10 stand.

## Standing

- INCONCLUSIVE-as-recorded (not negative: the question is precise
  and the missing data specified). Zero worlds. Cumulative
  unchanged (8331).
