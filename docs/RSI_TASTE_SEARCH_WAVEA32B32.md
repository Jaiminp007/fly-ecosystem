# RSI v32 probe: eviction policy — BOTH directions dual-true, keep-hard +2.16

## v34 bank (`576c1998…`): the store-time lever is the strongest lead yet

Baseline Gen1 R=4 (b=0): 4.303 A-FALSE (bar fails A — third A-false bank).

| cell | b | score | vs bar | A | B |
|---|---|---|---|---|---|
| c34-keephard | +1 | 6.462 | +2.16 | True (1.807/1.633) | True |
| c34-keepeasy | −1 | 6.086 | +1.78 | True (1.821/1.713) | True |

Direction probe (predeclared, no productivity): keep-hard wins (+2.16
vs +1.78). keep-hard RESURRECTED the failing A-leg (1.807 vs 1.633):
forgotten-leg records are high-error → kept instead of
reservoir-dropped → rehearsed → resurrected. The mechanism story is
the retention killer run in reverse.

Caveat: count-4 descriptive; fresh eval adjudicates. 0 eval spent from
V32 (probe by design). V33 = keep-hard × skip interaction A/B
(evict line opens; V32 not a generation). 48 worlds. Cumulative 4744.
