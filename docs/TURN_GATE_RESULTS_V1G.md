# TURN-GATE Results V1g — dose escalation + selection-vs-boost decomposition (single authorized attempt)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1G.md` (no amendments).
Bank: `evidence/turn-gated-dev/fresh-07/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-07/`.

## Verdict: PHASE-G-GO; gain-boost clears the bar (borderline), selection does not, bundle sub-additive

Conjunctive gates (pre-registered, uniform arm):

- **G1 integrity 18/18 PASS** — join 1.00 everywhere; digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8292 / 0.8304 / 0.8134, all ≥ 0.5
  (SEVENTH replication of the 0.81–0.83 learning effect).
- **G2a uniform mean gap 0.6122 ≥ 0.3 PASS** — per-pair 0.5287 / 0.6462 /
  0.6616 (6th replication of the 0.52–0.67 transfer level).
- **G2b unlearned flat PASS** — +0.0007 / −0.0012 / +0.0002.
- **Seg1 mechanism replication (descriptive):** same-val ~0.95, flipped in
  band, all three (6th replication).

Ledger (exact): **18 mains, 0 probes, 32256 worldTicks, 774144 founderSlots,
2.91e9 scalarOperations** — within all caps; `redone: []` (single clean run).

Manipulation (pre-registered; all comparisons valid, no voids):

- **Null hygiene PASS** — train/uniform/unlearned/tournament read all-zero
  surprise counters (no INVALID override).
- **Gain arm fired** — 529 live `surpriseBoosts` + 269 replay boosts.
- **Bundle arm fired** — 421 live + 320 replay boosts.
- Tournament needs none (structural).

Directional HB gaps (extinction subset; +0.1 meaningful band FIXED):

| pair | uniform HB | tournament T3 | gain-only | bundle |
|---|---|---|---|---|
| 412010 | 0.412 | +0.095 | +0.149 | +0.057 |
| 412028 | 0.322 | +0.034 | −0.004 | +0.009 |
| 412046 | 0.360 | +0.070 | +0.168 | +0.119 |
| mean | — | **+0.066** | **+0.104** | **+0.062** |

Same-val diffs ≈ 0 everywhere (|≤0.007|, retention intact). BH ceiling
respected (no claim) but noted: monotone dose trend uniform (0.79) <
tournament (0.84) < gain (0.87) < bundle (0.89) on all 3 pairs —
consistent with, not claimed by, the HB finding.

## Reading: boost works (just), selection alone doesn't, bundle sub-additive

- **D2 (gain-only) +0.104 clears the bar** — borderline (+0.004 over) and
  heterogeneous (pairs 1,3 large at +0.15/+0.17; pair 2 zero). Per the
  frozen mapping this is a pass: the boost component works at dose →
  **V1h deploys + confirms gain-only.** The heterogeneity is the reason
  V1h is a confirmation, not a victory lap.
- **D1 (tournament T3) +0.066, below band.** Dose response vs V1f T2
  (+0.042→+0.066) is monotone but insufficient — selection alone does not
  clear the bar at T3.
- **D3 (bundle) +0.062, below band.** Boost adds nothing on top of T3
  (bundle−tournament ≈ −0.005); gain-alone beats bundle on pairs 1,3.
  Breadth×depth interaction: boost needs breadth (uniform sampling) —
  concentrated selection + concentrated boost over-narrows (same
  surprising records hammered at 4×). V1f's inconclusive decomposition
  is now resolved AGAINST additivity.
- **No overdose** (minimum −0.004 ≈ 0, not < −0.05), no degradation, no
  void. The STOP rule is NOT triggered (D2 cleared) — no pivot, no
  treadmill: V1h is deployment + confirmation of gain, optionally with a
  gain-seg2 arm to test whether the boost compounds over segments.

Status of the surprise-replay line after V1f–V1g (n=6 pairs, 2 banks):
the mechanism engages extinction at all tested doses (uniformly positive
directional gaps wherever manipulation fires); the minimal dose was
sub-therapeutic (+0.04–0.06); escalated gain clears the bar (+0.10);
selection contributes a smaller, dose-responsive part (+0.04→+0.07).
Cumulative 7608 (+18). No RSI claim.
