# Founder accounting correction

The initial `balanced-pressure-founder/20261026-v1` attempt stopped on its
first endpoint assertion because the independent reconstruction omitted the
probe's inherited `startingDebt` credit. It produced no result rows; its
partial protocol remains preserved. The endpoint definition is
`(final physical energy - starting energy - final debt + starting debt) /
founders`. The v2 continuation adds the missing term and retains the original
paired comparisons. Because the correction follows an observed failure, v2 is
a recovery audit rather than an unmodified pre-outcome run.
