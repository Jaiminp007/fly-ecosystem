# Steering mean-projection prototype

`learning/steering-mean-projection.mjs` implements the fixed standalone
own-history projection in `STEERING_MEAN_PROJECTION_PLAN.md`. It keeps one
running eight-feature mean and count per action, projects each proposed shared
increment against the prior mean, then records the current input. The caller
must supply the agent's actual executed action and features: identity and
monotonic ticks are checked, but this standalone function cannot verify their
physical provenance. It has no phase, cue-family or counterfactual input.

Three focused tests pass for action isolation, orthogonality before clipping,
zero-norm behavior, fixed serialized state size, restoration and provenance
guards. They also demonstrate that protecting a mean does not protect each
individual example, and subsequent clipping can break even mean protection.
With the existing encoded-state helper the initial prototype state occupies
255 bytes, declares 18 initialization operations and a 128-operation allowance
per call. The allowance has not been independently audited against the full
physical implementation or validated as hardware energy.

Eight combined prototype, crossover and cue-physical tests pass. No physical
controller invokes the new function, no simulation has assessed its effects,
and it is not a paid acquired skill or evidence of improvement. Constant bias
features and a global historical mean could substantially inhibit useful new
learning. Evaluate it first on recorded own factual steering transitions with
fixed executed actions, including action-conditional support, prediction drift,
work and memory; then only if informative implement fully accounted physical
controls. The original scientific gates and closed reserves remain unchanged.
