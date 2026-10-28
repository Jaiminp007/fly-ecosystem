# Prospective pursuit-interface diagnostic

This is one new source-motivated motor-interface hypothesis, not a retest or repair
of the failed taste-speed bank. No prior scientific gate is reinterpreted. The
existing approach turn uses the sine of food bearing, so it cannot distinguish
an aligned target from an exactly rearward one using that term alone. The engine
already supplies both cosine and signed-sine components. The new bundle decodes
that bearing and turns in place when the available one-tick angular authority
cannot cancel it. No candidate learning is tested or used to choose this rule.

## Frozen motor semantics

The raw engine sensors, not the odor-transformed learner observation, supply
cosine `raw[0]`, lateral components `raw[1:3]`, and walls `raw[10:12]`. A positive
sum of the three squared directional components identifies a target. For held
action `a` in {-1,+1}, bearing is `atan2(a*(raw[2]-raw[1]),a*raw[0])`. Canonicalize
exactly -pi to +pi. The target-present turn is clipped `bearing/.28`; movement is
`-1` (stationary) when `abs(bearing)>.28`, and `0` (normalized speed .5) otherwise.
The .28 boundary is the existing 2.8 radians/second times .1-second physical step,
not a threshold selected from outcomes. There is no target-present wall override.
For an absent target, cruise at movement 0 with turn
`tanh(1.8*(raw[10]-raw[11]))`. Eat output equals `a`; reproduction is -1 and signal
is 0. Positive action pursues/feeds; negative action faces away and refuses food.
No intake-stop reflex, alternative threshold, rate sweep or post-result selection.

Turning cancels at most the sensed error before heading noise, obstacle deflection
and target changes. It is not exact physical alignment. The bearing targets the
engine's ranked patch; an odor may instead come from a contact patch. No guaranteed
cue-target identity is assumed. The learner does not automatically gain raw
bearing access merely because this reactive motor uses it.

## Four fixed nonlearning arms

- `legacyFast`: existing approach/feed motor at normalized speed .5.
- `pursuit`: new motor with positive held action.
- `refuse`: the same new interface with negative held action.
- `random`: independent per-body uniform positive/negative choices every eight
  ticks, using the same new interface. This is not random speed.

Sixteen fresh histories first run fixed privileged-value-oracle cue warmup for
1,536 ticks or extinction. Each checkpoint is copied into four original-ecology
256-tick probes sharing the resource seed. No body/food/energy refill. All original
founders remain denominators. Warmup costs are common and excluded from probe
deltas, not removed from evidence. Oracle-prepared states are not proven reachable
by a learner. The original physical engine, resource rules and prices stay fixed.
Budget: 16 warmup worlds + 64 probes, at most 40,960 physical world steps.

## Decision, costs and evidence

All three paired energy effects, pursuit minus legacyFast/refuse/random, must
have positive simultaneous one-sided Student-t lower bounds, df=15, Bonferroni
alpha=.05/3. All three observed mean-survival differences must be nonnegative.
The endpoint is final surviving body energy minus initial probe body energy and
unpaid controller debt, divided by all original founders. Mean-survival guards
are not survival confidence bounds. No sample extension, replacement, tuning or
promotion follows failure on this bank.

Decision work is one declared scalar operation, plus six for a random draw.
Legacy motor work is six operations/tick. New motor work is sixteen operations
with a target, nine without: squared magnitude/target test six; present-target
signed components and atan2 four, pi comparison one, division/clipping three,
absolute value/threshold two; absent-target wall difference/multiply/tanh three.
This abstract operation price is not CPU time. Native controller/background
costs remain, as do canonical state-byte-time charges and terminal unpaid debt.
Report actual CPU/wall runtime separately.

Record per-tick raw directional/wall inputs, held action, outputs and declared
motor operations as observer-only events. Freeze all source/test/seed inputs,
fresh histories, prices and rules before collection. Independent Python must
reconstruct motors, decisions/RNG, work, bytes, ledgers, endpoints and statistics;
altered traces must be rejected. Exact captured-source Node replay must reproduce
all worlds/rows/trace hashes. Independent motors do not independently establish
the physical origin of their recorded sensors; exact replay has that scope.

A pass establishes only this motor bundle's superiority in this checkpoint
distribution. It does not isolate bearing from turn-in-place, qualify a learner,
or satisfy learned transfer. Any eventual learner must beat reset AND always-
accept **using this same new interface**, not a deliberately weaker old baseline.
Acquisition, separate A/B retention, survival, meaningful memory pressure and
all later autonomous/copy-control RSI gates remain required and unachieved.

Post-collection: [the diagnostic failed](PURSUIT_ACTION_AUTHORITY_RESULTS.md).
The frozen floating survival scorer's tied-guard artifact is preserved. The
working scorer registers `survivalArithmetic: exact-founder-counts-v1` for future
use and derives guards from paired integer founder counts. This separate
software correction does not replace original source/results or authorize
rerunning this failed hypothesis. The energy failure is unchanged.
