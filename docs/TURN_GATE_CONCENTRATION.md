# TURN-GATE concentration note — the error lives in ~3 HB cues; targets move (post-closure analytic, zero worlds)

Date: 2026-10-26. Method: read-only replay of frozen rows from
`evidence/turn-gated-dev/attempt-08/` (V1h) + `attempt-09/` (V1i),
uniform-seg1 arm unless noted. No new worlds, no rescoring, no verdicts
touched. Post-closure analytic (non-qualifying): the TURN-GATE line stays
CLOSED; this informs future-line design only. (PID proper remains
infeasible on frozen rows — no joint cue distributions archived; this
concentration analysis is the feasible substitute, as flagged.)

## Finding

Per-cue error mass = contact × (1 − correctness), summed over the
transferred row; concentration = share of the top contributors:

- Uniform seg1, 6 pairs × 2 banks: the top-1 cue holds **26–43%** of
  total error mass; top-3 hold **69–81%**. The top contributor is an
  HB (harm→ben, must-unlearn-turning) cue in **6/6 pairs**.
- Gain arms (V1i): total mass shrinks monotonically (uniform → gain
  −28%; gain → gain-seg2 −22% more), but concentration PERSISTS —
  top-3 hold 65–81% in every arm. Gain does not flatten the distribution.
- Identity is stable-or-shifting, never diffuse: pair 1 keeps the same
  top cue across all three arms; pairs 2–3 hand the crown to a different
  HB cue as the previous-worst gets fixed faster than the rest
  (whack-a-mole). As total error shrinks, the residue concentrates
  further on the hardest cue (pair-1 seg2 top-1 = 48%).

## Reading (design implication only)

A cue-TARGETED replay boost (identify the worst cue, boost only it) is
NOT licensed: the target moves under treatment (identity shifts in 2/3
pairs), and the distribution never flattens (a fixed target list would
chase residue). Global surprise-gating remains the right granularity —
it shrinks the whole mass while the hardest cue defines the pair's
floor (consistent with pair-specific floors 0.79/0.87/0.81 and the
floor-attribution's extinction account). The floor question is now:
what makes the hardest HB cue hard (cue features? contact history?
codebook position?) — answerable per-cue on frozen rows, and the last
analytic step before any structural line. No RSI claim.
