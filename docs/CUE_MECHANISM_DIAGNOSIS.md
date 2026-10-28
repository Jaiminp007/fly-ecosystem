# Cue representation mechanism audit

The failed fixed cue-learning bank remains unchanged and unqualified. A separate
deterministic representation check used no worlds, rewards, valence labels, fitted
parameters, policy selection or learning outcomes. It enumerated all sixteen
possible four-bit odors across 243 fixed nuisance/history contexts: three energy
levels, three proximity levels, three previous-intake values, three wall settings
and three fixed histories. Source hashes and the enumeration are preserved under
`evidence/cue-mechanism-audit/20261024-v1`.
The [portable manifest](../handoff/cue-mechanism-20261024/manifest.json) and
[restore verification](../handoff/cue-mechanism-20261024/verification.json)
preserve all 88 packaged files with zero hash mismatches.

Of 243 contexts, 76 produced identical active sets for at least two different
odors. The minimum distinct active-set count was 12 of 16. Independent Python
verified those duplicates and computed exact rational ranks of the recorded
16-by-64 binary activity matrices: 112 contexts had rank below 16, with minimum
rank 12. There were 3,888 feature evaluations and no statistical sample.

Identical active sets force identical readout outputs for every possible choice
of readout weights in that particular context. Rank deficiency additionally limits
the readout's freely assignable responses there; it does not prove failure for
every particular labeling. Neither observation establishes the cause of the
whole empirical failure or proves a replacement representation will learn.

Before another prospective learner study, use a representation that preserves
odor identity in these contexts, check its interface without fitting to failed
outcomes, and independently validate the original-environment transfer action
interface. The separately preregistered transfer diagnostic is described in
[TRANSFER_ACTION_AUTHORITY.md](TRANSFER_ACTION_AUTHORITY.md). Learning, per-skill
retention, survival, persistent autonomous revisions and copied-improvement
controls remain required. No RSI has been demonstrated.
