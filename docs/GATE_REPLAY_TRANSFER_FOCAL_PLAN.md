# Outcome-selected focal transfer steering intervention

For each of the eight reused reservoir histories, select the D-start body with
the largest recorded native-minus-current final physical energy difference,
using zero for a dead endpoint and lowest body id for ties. This selection is
explicitly based on the observed outcome; if no difference is positive, skip
that history. Record each selection and the inputs' hashes before simulating.

From the already saved current-steering physical start, force native steering
for that focal body only; all other bodies keep learned steering. From the
saved native-steering start, allow learned steering for the focal body only;
all other bodies keep native steering. Every body computes the same charged
selector, uses the same frozen learner and retains its own unpaid debt and RNG.
The external per-body assignment is an experimenter intervention, not a
sensor, learner state, or counterfactual training label. Compare each focal
outcome against its actual all-current and all-native recorded outcomes, and
report world energy, food and survival; preserve all four worlds and avoid
individual-effect claims where trajectories and RNG interact.

Capture start/end checkpoints, compressed tapes and source/input hashes;
independently verify assignment, reported work/debt, starts and exact replay.
These outcome-selected reused histories are not a development pass, fresh
qualification or justification for changing pressure, retention or transfer
gates. Require 1 GiB free before collecting and a 100 MiB floor during it.
