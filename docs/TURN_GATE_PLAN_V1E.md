# TURN-GATE Plan V1e — 4× exposure / asymptote probe (DESIGN ONLY)

Status: FROZEN 2026-10-31. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question

V1d: doubled exposure (cumulative 3584 ticks) moves flipped-cues from
0.587 to 0.709 (uniformly up, ~1/3 of remaining distance-to-train closed
per doubling) — partial convergence, neither H-plastic (≥0.85 at 2×) nor
H-rigid fully supported. Does the tax VANISH with enough exposure (and on
what timescale), or does it ASYMPTOTE above zero (structural floor)?

## Design

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1d):
train (1792, snapshot) → seg1 (transplant of train-end; gated
V1c-replication arm) → seg2 (transplant of seg1-end) → seg3 (transplant
of seg2-end) → seg4 (transplant of seg3-end; cumulative 4×1792 = 7168
ticks on the test codebook) + unlearned (1792, flat control).
6 arms × 3 pairs = **18 mains**, 0 probes, BT_TICKS=1792 every arm
(ledger: 32256 worldTicks, 774144 founderSlots expected).

This nests all prior findings as replications (seg1 = V1b/V1c/V1d transfer;
seg2 = V1d partial convergence) and adds two new trajectory points
(seg3, seg4). Transplants 3 and 4 use the identical machinery
(snapshot/copy/assertFreshTarget/integrity + digest equality); rows that
source a transplant (train, seg1, seg2, seg3) persist weights, seg4
terminal does not (digest record suffices) — the V1d rule generalized.

## Gates (seg1-gated; seg2–seg4 descriptive)

Identical bars on train + seg1 + unlearned: G1 integrity on ALL 18 rows
(join ≥0.99; seg2/seg3/seg4 triples REQUIRED present fail-closed, never
gating) + G0 train ≥0.5 all 3 else INCOMPLETE-UNTRAINED + G2a seg1 mean
≥0.3 + G2b unlearned flat ≤0.1 all 3. Verdict PHASE-E-GO/NOGO
(+INCOMPLETE/INVALID fail-closed).

DESCRIPTIVE seg2/seg3/seg4 flip-splits (Amendment-A1 metric) vs the same
train row, with per-segment class (CONVERGED/RIGID/DEGRADED/INTERMEDIATE/
INDETERMINATE — V1d branch rule) and chained deltas, recorded separately
from the verdict.

## Why the convergence gate is DECLINED (pre-registered reasoning)

V1d RESULTS licensed V1e to gate on convergence ("may", not "must").
Declined: exponential extrapolation of the V1d trajectory (gap closes ~1/3
per doubling: 0.363→0.241) predicts seg4 flipped ≈ 0.84 — borderline
against a 0.85 gate, i.e. a coin-flip NOGO that would obscure the real
finding (the trajectory SHAPE). A gate adds no knowledge beyond the
descriptive classification: seg4 ≥0.85 IS convergence proven, with or
without a gate string attached; a threshold FAIL at 0.84 with a monotone
trajectory means "slower than guessed", not "transfer fails" (seg1 gates
that separately). The bands remain the interpretive instrument; V1e's
contribution is the 4-point trajectory (seg1→seg4), from which the
asymptote question is read. If seg4 lands ≥0.85, H-plastic is proven and
no V1f is needed for the convergence question; if the trajectory
saturates below, the floor value + saturation point motivate the
structural line (capacity/architecture interventions).

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-05/`: 6 histories × 9 = 54 seeds
410001–410054 (verified clean 2026-10-31 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 409001–409054 + all fixture seeds). seg2/seg3/seg4 reuse the test
history object — no new seeds needed. Caps: ≤300 exec (18 used), ≤20e9
ops, ≤3600s wall, ≤100MB. Single authorized attempt; crash-resume with
dual provenance only. No RSI claim.
