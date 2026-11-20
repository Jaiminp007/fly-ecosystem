# TURN-GATE Results V1i — boost×exposure interaction at matched 2× (FINAL chartered experiment)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1I.md` (no amendments).
Bank: `evidence/turn-gated-dev/fresh-09/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-09/`.

## Verdict: PHASE-I-GO; E1 CONFIRMS boost beats plain replay head-to-head — LINE CLOSED AS DEPLOYED

Conjunctive gates (pre-registered, uniform-seg1 arm):

- **G1 integrity 18/18 PASS** — join 1.00 everywhere; digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8156 / 0.8183 / 0.8080, all ≥ 0.5
  (NINTH replication of the 0.81–0.83 learning effect).
- **G2a uniform-seg1 mean gap 0.6537 ≥ 0.3 PASS** — per-pair 0.7401 / 0.5717 /
  0.6492 (8th transfer replication; highest pair-means yet, consistent with
  harder flips leaving more headroom).
- **G2b unlearned flat PASS** — +0.0007 / −0.0006 / −0.0019.
- **Seg1 mechanism replication (descriptive):** same-val ~0.95, flipped in
  band, all three (8th replication).

Ledger (exact): **18 mains, 0 probes, 32256 worldTicks, 774144 founderSlots,
2.95e9 scalarOperations** — within all caps; `redone: []` (single clean run).

Manipulation (pre-registered): null arms (train/uniform/uniform-seg2/
unlearned) all zero (no INVALID); gain-seg1 fired (434 live + 260 replay);
gain-seg2 fired (280 live + 388 replay). No voids — every comparison valid.

HB correctness (harm→ben extinction subset; contacts 1200–4800 per cell):

| pair | uniform s1 | uniform s2 | gain s1 | gain-seg2 |
|---|---|---|---|---|
| 414010 | 0.338 (1 cue) | 0.391 | 0.655 | 0.615 |
| 414019 | 0.314 (3 cues) | 0.470 | 0.415 | 0.600 |
| 414037 | 0.309 (2 cues) | 0.552 | 0.364 | 0.689 |

- **D0-replication: gain−uniform seg1 = +0.317 / +0.101 / +0.054 (mean
  +0.158)** — clears +0.1 (3rd measurement: V1f +0.064 [miss], V1g +0.104
  [hit], V1h +0.134 [hit], V1i +0.158 [hit]; monotone across banks).
  Stop rule does NOT trigger.
- **E1-interaction (headline): gain-seg2 − uniform-seg2 = +0.224 / +0.130 /
  +0.136 (mean +0.163)** — ALL THREE pairs clear +0.1 with both arms
  fired. Per the frozen mapping: surprise-gating CONFIRMED as the better
  2× deployment. No V1j needed for the interaction question.
- **E2-uniform-trajectory: +0.053 / +0.156 / +0.243 (mean +0.151)** —
  replicates V1d's +0.12 plain-exposure increment (contextual).
- **E3-gain-trajectory: −0.040 / +0.185 / +0.271 (mean +0.157)** — same
  direction as V1h D2 (+0.26) though smaller and with pair-1 flat
  (−0.040, the pair that started highest at 0.655 — near its floor).
- Same-val diffs ≤ 0.011 (retention intact everywhere, all arms). BH
  ceiling: monotone dose trend again (unclaimed, consistent).

## Reading: the transfer arc is answered (descriptive; claims stop here)

The four pre-registered questions resolve: (1) transfer replicates at 1×
across 8 banks (uniform means 0.48–0.66, always ≥ 0.3); (2) the tax is
extinction failure (direction gap 0.51, replicated ×3 lines; floor =
uncorrected flips, pair-composition accounting); (3) surprise-gating
accelerates unlearning vs uniform at 1× (V1f–V1i D0/D: +0.04 → +0.16
across lines, monotone); (4) boosted exposure compounds (V1h D2 +0.26,
V1i E3 +0.16) and beats plain replay head-to-head at matched 2× (V1i E1
+0.16, all pairs). No directional gap below −0.1 anywhere across V1f–V1i
(one marginal −0.004 in V1g pair-2, within noise of zero) — no overdose by
the pre-registered definition; no retention cost anywhere
(same-val ≈ 0.95 in every arm of every line); manipulation verified
fired in every intervention arm fielded (null arms always silent).

Per the frozen plan this CLOSES the TURN-GATE line: all findings
published, no V1j licensed. Standing record: cue-conditioned turning
transfers across codebooks with a structured, extinguishable tax; the
deployed recommendation is gain-gated replay (surpriseGain 1.0 +
replaySurpriseGain 3, tournament 1) sustained across segments. The open
floor questions (which cues resist: PID decomposition; noisy replay;
macroscale level) and the population track (energy ecology + inherited
variation to seg-2+) are separate lines under their own frozen plans.
No RSI claim.
