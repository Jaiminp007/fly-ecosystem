# Target-taste acquisition readback correction

The original independently instrumented acquisition replay reached the eighth
history and failed a strict in-memory checkpoint comparison because JavaScript
distinguishes negative zero from positive zero while the archived checkpoint
was serialized to JSON, which normalizes both to zero. The original checker,
captured study sources, traces and failure are not replaced or reinterpreted.

The V2 checker compares the replay checkpoint after the same JSON
serialization used by the collector, while retaining exact trace hashes,
sensor, action, storage and endpoint checks. V2 is a post-outcome audit repair,
not a new experiment or independent physical simulator. If it fails, preserve
that result and investigate further rather than assuming this was the only
problem.
