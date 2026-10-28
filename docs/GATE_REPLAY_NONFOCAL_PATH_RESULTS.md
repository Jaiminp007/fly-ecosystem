# Nonfocal transfer path and RNG census

The fixed `GATE_REPLAY_NONFOCAL_PATH_PLAN.md` replays the four previously
selected cases where neither focal steering swap changed the focal's discrete
native-versus-midpoint action. Both original whole-world traces and final
checkpoints reproduce exactly.

| Seed / body | Equal physical RNG before / after | First roster difference | First focal sensor difference | First focal turn / position difference |
| --- | ---: | ---: | ---: | ---: |
| 1172370180 / 18 | 256 / 256 ticks | None | 1794 | 1806 |
| 748966988 / 9 | 256 / 256 ticks | None | 1811 | 1864 |
| 3285880790 / 9 | 256 / 256 ticks | None | 1795 | 1884 |
| 681849533 / 15 | 37 / 36 ticks | 1828 | 1830 | 1829 / 1829 |

In the first three cases the physical RNG state and living roster agree for
all 256 recorded ticks even though focal sensor inputs, turn commands and
positions eventually diverge. The unchanged discrete action means native
steering is selected in both worlds; it does **not** mean its actual turn
command is identical after its inputs diverge. In the fourth case the roster
first differs at tick 1828 and physical RNG state differs after tick 1829;
the RNG streams remain equal only through the recorded initial prefix.

Thus a diverged physical RNG stream cannot explain the first three cases'
matched-tick differences, but this observation does not isolate competition,
resource depletion, geometry or their interactions. The cases were selected
after outcomes, so their counts are not a general population estimate.

Evidence: `evidence/gate-replay-nonfocal-path/20261026-v1`. An independent
checker reconstructs 1,024 paired ticks and 61,230 events, verifies per-tick
states, full trace hashes and exact final checkpoints. It uses captured engine
code, not an independent physical simulation. No learner received observer
data; the original pressure, retention, transfer and fresh-audit gates remain
unmet, and no reserve is opened.

The old social-yield predictor failed on a different dataset and target; neither
that failure nor these four cases establishes that a new social feature would
improve control. First trace recorded resource changes in the three RNG-aligned
cases without changing trajectories, before selecting a new learner mechanism.
