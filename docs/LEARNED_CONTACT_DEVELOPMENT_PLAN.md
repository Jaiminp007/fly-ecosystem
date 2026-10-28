# Learned contact gate physical development

Run exactly three acquisition arms (`learned`, `random`, `shadow`) on the
original eight development histories from the original initial worlds, with
512/512/512/256 A/B/C/D steps, supported steering, rbase factual replay and
motor freeze after A. Gate intervention is phase-blind and only applies to an
accepted, odor-present homogeneous contact when the sampled motor would move.
Learned chooses its higher immediate-reward estimate with 10% exploration;
random chooses uniformly; shadow always keeps the sampled move. All draw two
random numbers, compute both values and update from actual own feedback with
identical declared work and state shape. Gate selection and update charges are
100 and 70 scalar operations, plus three wrapper operations on each eligible
decision. The target subtracts all current observation work and the gate update
charge before computing the clipped energy change. Ineligible ticks do no gate
work. Save and freeze the actual gate weights alongside other saved A/B models.

After D, use the original A/B saved-model, current and reset 256-tick probes,
and original transfer current/reset/native/guarded/cheap-native probes. Copy,
reset, freeze, debt and storage charges remain explicit. Evaluate the same raw
A advantage, A interference, A net-intake difference, B acquisition,
retention and transfer energy/survival gates as earlier studies; report each
arm's actual D survivors and own gate action exposures. Both actions must have
been physically sampled by every D survivor of a learned or random arm for the
result to be a readiness pass; otherwise report failure, not a weaker criterion.
Shadow is an efficiency/control baseline, not an equal-action-exposure control.

Capture source closure, compressed checkpoints and event tapes; independently
check action provenance, own factual targets, selector RNG, updated weights,
reported work/storage/debt, endpoints and exact replay before interpreting any
outcome. These histories are reused and outcome-informed: no result constitutes
fresh qualification or autonomous revision. No hidden labels or staged stopping
override are allowed, and all prior failures and reserves remain intact. Require
at least 1 GiB free before collection and a 100 MiB floor during collection.
