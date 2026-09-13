# Legacy compact architecture and model specification

This document describes the v1/v2 compact model retained under
`npm run start:legacy`. The primary v3 entry point is specified in
[`MALECNS.md`](MALECNS.md). Results from these systems are not interchangeable.

The authoritative world lives in `engine.mjs`; the browser never advances it.
`server.mjs` owns one World, advances fixed 0.1-second steps within a wall-clock
budget, serves snapshots and handles controls. Canvas rendering polls snapshots.
A seed and checkpointed RNG make continuation deterministic on the tested runtime.

## One step

1. Renew food with external energy and optional sinusoidal seasonality.
2. Calculate all agents' sensory inputs and recurrent neural outputs.
3. Shuffle resource access order; move, charge energy and consume nearby food.
4. Record deaths and remove dead agents.
5. Match eligible opposite-sex partners; transfer parental energy to offspring.
6. Record births, extinction and sampled population history.

## Genome and learning

Founders have 17 inputs, 5 outputs and 8 hidden neurons. Food-seeking founder
weights are deliberately engineered. Inputs include abstract food/mate bearings,
energy, age, walls, signal, previous food and a periodic signal. Outputs control
turning, movement, eating, mating and signaling.

Inheritance unions homologous parental node/edge sets, selecting shared alleles.
This can retain unnecessary structure. Mutation adds neurons more frequently than
it removes them. Structural growth is therefore not evidence of adaptive benefit.
Lifetime eligibility-trace plasticity modifies bounded individual weight deltas.
Offspring inherit genomes, not those acquired deltas or recurrent activity.

Mating requires opposite simulated sexes within 26 world units, both mature,
energy at least 65, expired cooldowns and positive mating outputs. Each parent
transfers 24 energy; the child receives 48. Sex is randomly assigned. Lifespan,
energy depletion and capacity rules remain finite. There is no automatic reseeding.

## Persistence and known limitations

The baseline serializes full current world state to a single atomic autosave;
manual saves are separate checkpoints. It keeps all lineage metadata, but only
bounded history/events and no complete neural genomes for dead individuals.
Consequently an extinct autosave cannot reconstruct earlier neural decisions.
Baseline restarts restore the world paused; this is not always-on cloud recovery.

Version 3's Python arena imports the retained MaleCNS graph using pinned source
checksums and uses it as the local population controller. That does not make it a
biological validation; the sensory adapter, physiology and body decoder are models.
