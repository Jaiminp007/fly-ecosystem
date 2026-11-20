# RSI P3 headroom check (frozen before the run)

Date: 2026-11-15. The P2 dev check failed
([RSI_P2_DEV_RESULTS.md](RSI_P2_DEV_RESULTS.md)). Its pre-committed stopping
rule ended the taste-program RSI line. **The user overrode that rule** and
asked to keep pursuing RSI. This is a new study, not a re-run of P2:

- it uses fresh banks (997001–997012) and no P2 dev rule seed;
- it has no learner;
- the history of P2's failure is disclosed in every P3 writeup.

Runner: `scripts/rsi-p3-headroom.mjs`. Its search core is copied verbatim
from P2, plus one fixed "greedy" order.

## Arms (budget 8, threshold decisions, energy objective, as in P2)

- **G (greedy):** `keepOnly/evid/` k = 3, 4, 2, 6, 8, 1, then the hyper
  moves, in that fixed order. One seed.
- **U (uniform):** the full grammar in random order. Two seeds, averaged.
- **I:** the identity code, with no search.
- **First-move probes:** from identity, `keepOnly/evid/{2,3,4,6}` and the
  4 hyper moves. Each probe's dev gain is measured.

## Problems

- 9 single-term rules: s1+, s2−, s4+, s5−, s7+, s10−, s11+, s12−, s15+.
- 3 three-quarter-good gates: AND(1,2)−, OR(0,1)+, AND(2,3)−.

## Criteria (a learner is written only if H1 and H2 pass)

- **H1 headroom:** mean G − U ≥ 1.5 over all 12 problems.
- **H2 chain:** G accepts ≥ 2 moves per search on average.
- **H3 context:** the most common best first move wins ≤ 75% of problems.

If H3 fails, the best first move does not depend on context. A learner
could then only learn a constant prior, and any claim has to be worded that
way.

If H2 fails, the next step is a larger budget or a richer program space,
not a learner.
