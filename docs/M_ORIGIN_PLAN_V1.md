# M-ORIGIN descriptive plan V1 (exploration-tax mechanism)

Frozen 2026-10-29. Status: DESIGN ONLY until analysis. Zero new worlds, zero
seeds, zero bank contact — spent M-GATE + S-GATE control mains as MEASUREMENT.
Licensed by WHAT-RETAINS Q1 (level gain is exploration tax:
candidate≈reset≫unlearned; no arm-targeted intervention licensed).
This plan licenses NO intervention: it decomposes the tax, then names what
(if anything) the decomposition licenses next.

## Data (verified present read-only 2026-10-29)

Control-main endpoints (`tau-null`/`null` rows, 8 histories across both
studies): `budgetAdjustedEnergyPerFounder, physicalEnergy, startingEnergy,
startingDebt, outstandingEnergy, incurredEnergy, paidEnergy, scalarOperations,
additionalScalarOperations, operationsBilled, survivors, founders, totals,
foodInventory, learnerEncodedBytes, accountingResidual`. Per-decision streams
for unlearned/reset mains DO NOT EXIST (no emit was attached) — any
decision-structure question is explicitly OUT OF SCOPE (needs new data under
its own future plan, not authorized here).

## Q1 — ops account (is the tax billed exploration?)

Exact: per control history, T = value(reset) − value(unlearned)
(`budgetAdjustedEnergyPerFounder`; expect ≈+5). Δops = ops(unlearned) −
ops(reset) (`scalarOperations`); billed share = Δops × operationEnergy /
founders / T (operationEnergy from `BT_PRICING`, same constant all runs).
Descriptive bars: mean±sd of T and billed share across N=8.
Rule: billed share ≥0.50 on mean → the "gain" is literally the cost of
exploring (license NOTHING intervention-like; reframe all development gains
as cost-avoidance in RESULTS). Billed share <0.20 → ops do not explain it →
go to Q2's physical account for the alternative.

## Q2 — energy/outcome account (where does the unpaid remainder sit?)

Exact: per control history, decompose T into ΔphysicalEnergy, Δoutstanding,
Δpaid, Δincurred (unlearned minus reset, per-founder), plus Δsurvivors and
Δtotals.foodEaten-equivalent. Descriptive bars: component means±sd; fraction
of histories where unlearned suffers more deaths.
Rule: if deaths explain it (unlearned fewer survivors on ≥6/8 histories with
the energy gap tracking deaths) → LICENSE a foraging-risk proposal
(descriptive follow-up on terminal-tick structure, zero worlds). If the gap
is living-founders-eating-less with equal survival → LICENSE a
consumption-structure proposal (same constraints). If neither pattern clears
its bar → license nothing; report the residual as unexplained.

## Q3 — cross-history structure (does the tax scale with anything?)

Exact: correlate T against unlearned `operationsBilled` and against reset
`operationsBilled` (N=8, Pearson + Spearman). Descriptive only.
Rule: |r|≥0.6 on either → that counter becomes the adjustment covariate any
future development comparison must carry (publish the adjustment, license no
intervention). Else → no covariate; report null.

## Analysis discipline (violations invalidate the run)

- Tool: `python3` + stdlib ONLY; no engine imports, no node, no worlds.
- Reads: the two attempt dirs' rows (+ledgers for caps sanity, no recompute).
  No writes to `evidence/`; scratch in pipes only (no /tmp handoffs — /tmp
  does not persist across commands in this environment). Output:
  `docs/M_ORIGIN_RESULTS_V1.md` (+ status updates), committed.
- No new banks/seeds/worlds; no qual contact; no RSI claims; no verdicts on
  prior attempts (their numbers are inputs).
