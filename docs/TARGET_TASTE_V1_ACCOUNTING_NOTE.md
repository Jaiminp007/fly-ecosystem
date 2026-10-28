# Target taste v1 accounting correction

The first frozen headroom run charged the common filter decision but omitted
one scalar write when replacing a selected midpoint action with native steering
(and, during acquisition, a second write to the pending action). The v1 traces
and readback remain preserved in `evidence/target-taste-headroom/20261026-v1`,
but its physical results are undercharged and must not support a promotion.

The working implementation now charges each actual rewrite. V2 repeats the
same fixed eight-history, four-arm frozen comparison with the corrected source;
it is a post-outcome rerun, not a new independent sample. Existing discount,
observations, policy rule, controls and qualification thresholds remain fixed.
