# First matched learning campaign

Three seed pairs started with identical founders, neural state, positions and RNG.
Each pair differed in whether lifetime learning was enabled from birth. Mutation,
reproduction, resources and the cyclic environment were enabled in both arms.
Every habitat completed 7,200 ticks: one 720-second challenge cycle.

| Seed | Population: learning / control | Births: learning / control | Mean acquired change: learning / control |
| --- | ---: | ---: | ---: |
| 7 | 57 / 42 | 137 / 121 | 0.019592 / 0 |
| 23 | 54 / 53 | 142 / 145 | 0.019939 / 0 |
| 111 | 56 / 64 | 133 / 144 | 0.021018 / 0 |

- All six populations survived the horizon without hitting capacity, recording
  **822 births** in total.
- Acquired weights changed in the enabled arms and remained zero in the controls.
- Birth totals were 412 with learning and 410 without. Population outcomes varied
  by seed; this small campaign does not establish a consistent learning advantage.
- These measurements precede live continuation. Later dashboard counts should
  not be substituted for the fixed-horizon comparison.

`results.json` records configurations, source hashes, founder-matching evidence,
checkpoint hashes and the original runner hash. Full mutable worlds remain local
under ignored `runs/`. The packaged runner has portable paths and optional short
horizons/paused completion; its provenance note distinguishes it from the original
cloud runner that collected these results.

To reproduce the default campaign, start `npm run start:platform`, then run
`npm run train:platform`. Training uses Python's standard library. A repeat call
resumes the latest campaign and preserves its observations. Use `-- --new` for a
new campaign. `-- --pause-after` retains completed habitats paused. A platform
process is limited to 16 habitats; keep separate experiment storage when needed.

The next milestone is useful learning and memory on **unseen, unpredictable
tasks**. Network growth, continued reproduction and weight changes are observations,
not substitutes for that goal. See `docs/PLATFORM.md` for the evaluation plan.
