# Frozen transfer timing headroom diagnostic

Agreed in a read-only [Astra discussion](t3-thread://v1/mcp:65dee2c2-6de9-411b-9e34-31afe7486364)
after exploratory attempts 08--16. No learner revisions follow until this test
establishes whether these two concrete lawful timing policies offer headroom.

Use exactly attempt 15's eight end-C checkpoints, original transfer resource
seeds, 256 ticks and half-speed cruise output 0. Compare three frozen executors:
always cruise, bounded harvesting, and bounded alignment. Retain the original
bare always-cruise result as an external reference. No privileged fork, policy
combination, duration sweep or new training is part of this diagnostic.

Every executor retains identical current-15 shadow weights, normal uniformly
compacted choose/observe work, and selector fields `started`, `pausing`,
`pauseTicks`, `cruiseDue`, `alignmentArmed`, initially false,false,0,false,true.
All fields are billed in all arms using the existing typed encoding (numeric
values cost eight bytes, booleans one byte). The selector's actual operations
are billed. The shadow decision is overridden before physical execution; both
the pending credited action and held movement are synchronized to that actual
action. No learning or unfinished motor update is allowed. Acceptance and native
steering are unchanged. All original founders, bodies, random states and debt
are retained without refill or revival.

The first action is always cruise, so intake before resource relocation cannot
trigger harvesting in the new geometry. Harvesting then triggers on lawful local
contact and positive previous signed intake, pauses immediately, and continues
while that condition holds for at most four consecutive ticks. Loss of contact,
nonpositive intake or the four-tick cap ends the pause. One mandatory cruise tick
is required before retriggering; an immediate cruise on condition failure counts.

Alignment triggers only while armed, outside contact, with sensed food proximity
greater than zero and forward bearing cosine below zero. It disarms on entry,
pauses immediately, and ends within four ticks or earlier on contact, no sensed
target, or forward cosine at least .5. A mandatory cruise follows. It rearms only
outside an active pause when the target is absent or forward cosine is at least
.5. Hitting the cap while still facing away cannot immediately restart a pause.

A timing policy is descriptively promising only if its mean energy gain is
positive against BOTH shadow cruise and bare cruise, it wins against shadow
cruise in at least 6/8 histories, and summed survivor differences are nonnegative
against both. This is reusable exploratory evidence, not statistical qualification.
Report all histories, triggers, pause durations/end reasons, stationary fraction,
intake, physical costs, learner charges and deaths. Negligible trigger exposure
must be disclosed. Failure rejects these two policies on these anchors, not
every possible policy or action headroom globally. It calls for a separately
bounded trajectory diagnostic rather than more learner variants.

The initial three targeted checks cover cap/cooldown/hysteresis, suppression of
opposite shadow motor logits with equal cost/encoding, frozen weights and terminal
debt/action lifecycle. Physical conservation and common-start hashes remain checked.

The research literature motivates an opportunity cost of time, rather than a
zero-energy threshold: [Niv et al.](https://www.princeton.edu/~ndaw/ndjd07.pdf).
[Wan et al.](https://arxiv.org/abs/2110.13855) provide average-reward options for
continuing interaction. These results do not establish a solution here: finite
lifespans with absorbing death make literal infinite-time average reward zero
eventually. Any subsequent option model must target the actual finite-window
energy/survival objective. These are methodological motivations, not performance
claims about the simulator or biological fidelity.
