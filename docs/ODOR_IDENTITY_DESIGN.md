# Prospective odor-identity representation

This engineering component addresses an exact source-visible sensory collision,
not a tuned response to the failed bank's reward outcomes. No learning candidate
is integrated, fitted, selected or qualified by this check.

Extract the four odor signs from the existing cue observation as
`[obs[0],2*obs[1]-1,2*obs[2]-1,2*obs[3]-1]`. All sixteen valid signed patterns map
to all sixteen Walsh parity products, one for each subset of signs, normalized
by 1/4. Each code has unit norm; distinct codes are exactly orthogonal. The
explicit absent/hidden cue maps to sixteen zeros, not a seventeenth invented
odor. Invalid mixtures are rejected. Nuisance sensors/history, task IDs, valence,
another body's experience and random streams cannot change the code. Feature
arithmetic is declared and charged to the caller's scalar-work counter.
The declared charge is six sign-extraction arithmetic operations plus fifteen
parity multiplications per odor (21 total), or six for neutral. Validation,
indexing and bookkeeping are excluded from that abstract arithmetic model;
actual CPU time and full state-byte-time still need campaign accounting.

The deterministic engineering grid repeats all sixteen codes across the earlier
243 nuisance/history contexts, without worlds or rewards. A separate Python
checker must reconstruct each code with exact rational arithmetic, verify the
enumeration and source fingerprints, and check rank, norms and dot products.
This verifies identity and representational capacity, not useful behavior.

## Pressure and transfer caveats

Shared coordinate support is NOT evidence of functional memory pressure. These
orthogonal codes are a rotated one-hot representation: an isolated direct update
along one code leaves another code's linear readout unchanged. A learner using
this component must separately demonstrate actual interference/capacity pressure,
own-trajectory acquisition, skill-over-reset and per-skill retention. Counting
overlapping active coordinates cannot substitute for that requirement.

The neutral cue block is zero, so it cannot alone explain any learned improvement
on the original odor-free environment. A prospective learner needs a separately
specified lawful context/motor mechanism for original-ecology transfer, with
learned-over-reset AND learned-over-always-accept tests using the same interface.
The [pursuit diagnostic](PURSUIT_ACTION_AUTHORITY.md) is only a mechanical check,
not that learned-transfer result. No RSI has been demonstrated.
