# Original-environment speed/action diagnostic

This prospective evaluation-only diagnostic checks the existing transfer probe's
action headroom before another learner is tested. It does not qualify learning,
retention, autonomous revisions or RSI. Failed banks and reserves stay unchanged.

## Fixed design

Sixteen fresh independent histories run the existing privileged-value oracle for
1,536 cue-world ticks. Each physical checkpoint is copied into four 256-tick
original-environment probes sharing one transfer resource seed. Physics, reference
and prices stay fixed. Oracle-prepared states are not proven learner-reachable.
Warmup cost is common and excluded from probe deltas, not erased from evidence.

All probes use the existing approach/feeding primitive. Only speed differs:
always fast, always slow, uniformly random speed, or a fixed taste reflex that
slows when its own previous-tick food intake is positive and otherwise goes fast.
Speed decisions occur every eight ticks. Random speed uses a separate per-body
stream. No probe reads cue meanings, future outcomes or another body's experience.
The reflex is specified before seed generation, not fitted. Storage/work is paid.

All original founders remain in denominators, including warmup deaths. The energy
endpoint is final surviving body energy minus initial probe body energy and
outstanding controller debt, divided by original founders. Survival is surviving
bodies divided by original founders. All probes must share an initial physical
checkpoint. Budget: 16 warmup worlds, 64 probe worlds, at most 40,960 world steps.
No learner worlds or learning probes are collected.

## Locked decision rule

Three paired seed-level energy effects compare taste speed against fast, slow
and random speed. All must have strictly positive one-sided Student-t lower
bounds with 15 degrees of freedom and Bonferroni alpha 0.05/3. All three observed
mean survival differences must also be nonnegative. These are descriptive mean
guards, not survival confidence bounds. No tuning, extension, replacement or
qualification follows failure on this bank.

## Evidence and checks

Freeze source, reference input, prior seed registries, engineering seed exclusions,
fresh histories, prices and rule before collection. Execute the captured entrypoint.
Preserve factual trace/row hashes. Independently reconstruct decisions, RNG, work,
byte-time, physical energy receipts, endpoints and statistics in Python, then
cold-replay all worlds and traces exactly in Node. These have distinct scopes.
Passing establishes only taste-reflex headroom in oracle-prepared states on this
bank. Failure does not prove that every available policy is ineffective.

Run initialization with `node scripts/transfer-authority.mjs init DIRECTORY`.
Run `collect`, `score` and `audit` using
`node DIRECTORY/sources/scripts/transfer-authority.mjs COMMAND DIRECTORY`.
Run the separate audit using
`.venv-research/Scripts/python.exe DIRECTORY/sources/scripts/audit-transfer-authority.py DIRECTORY`.
