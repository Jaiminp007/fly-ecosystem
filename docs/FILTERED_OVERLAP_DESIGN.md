# Paid filtered-overlap development protocol

The outcome-informed fixed filter processes pairs in their original order.
For each pair it computes the absolute x separation, skips the pair if that
value exceeds 32, otherwise passes that value to `Math.hypot` with the original
y difference. The midpoint ranking, guard, steering and physics are unchanged.
The two-unit margin protects the original 30-unit radius from rounding near its
boundary. The implementation is intended for finite physical observations;
no proof is claimed for arbitrary JavaScript numbers or engines.

Work accounting follows the existing scalar convention: four operations per
single-patch score, three per x filter (subtraction, absolute value, comparison),
three per remaining distance check (y subtraction, hypot, comparison), nine per
eligible midpoint. Loop/control assignments follow the same convention as the
original. The latest x separation lives in `scratch.separation` within every
controller, included by the existing canonical state encoding and billed for
the whole timestep, including for a zero-pair decision. No index or candidate
list is retained. Guarded, unguarded and matched native modes all execute and
pay for the same recommendation and scratch state.

Use only the existing eight attempt15 C anchors and their development transfer
seeds. Compare guarded to both filtered matched-native and archived cheap
native-full, with identical headroom gate: mean energy per original founder >0,
at least six of eight positive histories, and nonnegative aggregate survivor
difference against each. Capture all decisions, receipts, complete checkpoints,
source/input hashes and results. Preserve terminal debt. This is exploratory,
not fresh qualification, acquired behavior or recursive self-improvement.

Before interpreting any result, independently reconstruct work, storage,
debt, outputs and receipts from tapes; note that this is not an independent
physics simulation. The earlier offline checks cover observed decisions, while
unseen trajectories and runtime differences remain numerical risks.
