# Steering shared/absent-bank crossover

The fixed 2-by-2 plan in `STEERING_BANK_CROSSOVER_PLAN.md` crosses C/D shared
weights and C/D absent banks on each of the eight reused projection D worlds.
All four arms retain D taste and motors and pay 304 extra copy operations.
Every contrast below is D minus C for the named component; units are per founder.

| Contrast | Energy mean | Positive histories | Net intake mean | Survivor difference |
| --- | ---: | ---: | ---: | ---: |
| Shared at C bank | -1.200248 | 1/8 | -0.998220 | -1 total |
| Shared at D bank | +0.087073 | 3/8 | +0.154545 | 0 total |
| Bank at C shared | -0.354779 | 3/8 | -0.153246 | 0 total |
| Bank at D shared | +0.932542 | 6/8 | +0.999519 | +1 total |
| Interaction | +1.287321 | 7/8 | +1.152765 | +1 total |

Mean energy is 7.173208 for C shared/C bank, 6.818429 for C/D,
5.972960 for D/C, and 6.905502 for D/D. The severe D-shared/C-bank mismatch
and large interaction show that these components cannot be interpreted as
independently beneficial or harmful in this setup. Retaining a bank alone is
therefore not an established fix; any future protection mechanism must account
for the combined policy. These are outcome-informed total-world effects, not
individual causal attribution, fresh evidence or a cheap-control comparison.

Evidence: `evidence/steering-bank-crossover/20261026-v1`. The checker
independently reconstructs 252 charged assignments and verifies 64,216
decision/receipt pairs, frozen weights, summaries and exact replay of 32 arms.
Four focused lifecycle and crossover tests pass. The checker does not
independently simulate physics or validate low-level hardware energy pricing.

Next investigate phase-blind protection of the **combined** shared-plus-route
policy using factual samples, with fully accounted local state and comparison
against the original gates. No post-hoc C/D checkpoint substitution constitutes
a trained skill; the transfer failure, qualification boundaries and closed
reserves remain unchanged.
