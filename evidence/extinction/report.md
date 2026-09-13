# Extinction investigation

The preserved checkpoint reconstructs the final reproductive bottleneck from complete birth/death lineage timestamps and retained death events. No live-world settings were changed.

Last birth: tick 526199. At that point the population contained {0: 41, 1: 19} (simulated sex IDs).

Last sex-1 death: tick 527554. Remaining population: {0: 17}. The engine requires opposite-sex partners, so further births were impossible from this point. Extinction followed 472.4 artificial seconds later. The birth-free interval was 607.9 seconds overall.

Deaths since the last birth:

- Sex 0: 18 deaths from lifespan reached.
- Sex 1: 19 deaths from energy depleted.
- Sex 0: 23 deaths from energy depleted.

The final sex-1 death was recorded as energy depletion. The remaining sex-0 individuals died on reaching their lifespan. Thus available food at the end does not rule out earlier energy depletion: food can remain inaccessible to an individual or recover after population decline.

This establishes a terminal sex bottleneck, not the full cause of the preceding energy failures. The checkpoint retains traits and lineage for dead agents, but not their complete neural weights, locations, energy trajectories or action outputs. Those data are needed to distinguish poor foraging, spatial separation, mating decisions and resource competition. Earlier full checkpoints of this final-model run were not present in runs/; the other saved world is a different development run.

Code inspection also confirms brain-growth pressure: inheritance unions both parents' node and edge sets, with neuron-addition probability greater than removal probability. Neurons carry an explicit energy cost. These are plausible contributors to vulnerability, not demonstrated causes of this extinction. No counterfactual experiment has isolated their effect.

Recommended follow-up: rolling full checkpoints and per-sex population, reproductive eligibility, energy and death-cause telemetry; then replay a pre-collapse checkpoint under one changed mechanism at a time. Preserve this original run as evidence.
