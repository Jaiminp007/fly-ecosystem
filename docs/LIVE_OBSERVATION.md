# Latest live observation

Recorded 2026-10-24T02:05:09.318Z. This read-only sample observed 1 active habitat for 59.756985 wall seconds while polling the list, frames and individual agents. The other pre-existing running control had reached extinction and is paused. No habitats were reset, resumed or given a new policy.

[Runtime sample](../evidence/runtime-profile/56e71427-b314-49a0-b520-517d6e5aed93/live-sample.json) · [Habitat inventory](../evidence/runtime-profile/56e71427-b314-49a0-b520-517d6e5aed93/current-habitats.json) · [Terminal control summary](../evidence/runtime-profile/56e71427-b314-49a0-b520-517d6e5aed93/trace-control-terminal-summary.json).

| Active habitat | Requested speed | Actual ratio | Ending population in sample | Mean nodes | Dropped ticks | Clipped wall seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Cruising learner · breeding observation | 10 | 10.000504467× | 10 | 2611.700 | 0 | 0 |

This finite observation supports the measured simulation-time ratio in this window. It is not animation FPS, a controlled runtime comparison or a guarantee for later populations.

## Preserved control extinction

The trace food-renewal control ended at tick 1947749, population 0, after 20992 births and 21016 deaths. Recorded lifetime death counters are energy: 14071, age: 6945. The final recorded death event is labelled age. These counters do not identify a single overall cause of population extinction.

The exported terminal checkpoint restored exactly under current source. Its complete file SHA-256 is `2122c7eb53ea3d6a16e21a391014386cfb25acfedd2b23ea11452e97872132c3`. Energy-accounting residual at this long endpoint is 0.000202646479011; no exact zero-ledger claim is made. The raw checkpoint and startup source provenance are preserved beside the summary.

The breeding learner remains alive at the observation times, but these two long runs were not a fresh matched survival experiment. Their endpoint difference does not establish a causal learning advantage, autonomous algorithm improvement or RSI. A controlled long-horizon life-history study is a separate next research task; these endpoints must remain preserved.
