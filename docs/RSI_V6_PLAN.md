# RSI V6 plan (written and committed before the full run)

Date: 2026-11-12. Script: `scripts/rsi-v6.mjs`. Follows the failed
[V5](RSI_V5_RESULTS.md). Same three criteria as V5. C2 is made harder, and
the test bank is fresh.

## What changed from V5, and why

V5 failed because the training signal was thin: 4 problems, each search
chained from the previous winner. The libraries ended up full of moves
tried once with flat weights.

Two design checks were run on a separate dev bank (978001–978004,
single-term and majority rules only, never the test family), in
`evidence/rsi-v6/devcheck.json` and the `sharpcheck` mode:

1. Train on **8 problems**, each searched **from the identity start**
   (matching the test), budget 16. With V5's default rule U0, the trained
   library invented `keepOnly/evid/4` and ranked it top. It beat the blind
   library 8–2 (p = 0.055) on the dev bank. A dense-credit rule
   (`meanGain`: every try credited by its dev gain) did worse (6–2) and
   favored small "remove" moves. It stays in the U space but is not the
   default.
2. The trained weights were flat: the top move at 0.94 against about 30
   moves at about 0.45. Raising the same library's weights to the power 2
   gave 11–0 (p = 0.0005), mean 0.580 vs 0.477. Power 4 gave 10–1.

So V6 adds `power` ∈ {1, 2, 4} to the update rule (weight^power) and
`meanGain` credit with `beta` ∈ {5, 20, 50}. **U0 stays V5's default**:
{gain, α 1, ρ 0.25, floor 0.2, power 1}. Level 2 must find any better rule
by itself, on the validation bank. This check shows such a rule exists in
the space. It does not hand it to the system.

## Levels

- **Level 0:** taste program {masks, step, replays}.
- **Level 1:** library of moves built from genes (action × ranking × k),
  as in V5. The seed library has only blind moves. Moves are invented by
  mutating one gene, and are revised by U after each training problem.
- **Level 2:** a fixed coordinate search over U. The genes credit, alpha,
  rho, floor and power are taken in a shuffled order, one proposal per
  gene per pass, 6 proposals in all. beta is proposed only when credit is
  meanGain. Each U is trained with 2 training seeds. Each library is
  validated on 4 validation problems (bank 975101–975104) × 3 seeds:
  24 paired rows. A proposal is accepted if its mean is higher and paired
  wins > losses.

## Test (fixed)

- **Fresh test bank 987001–987008:** threshold rules, a family never seen
  in training. The rules are AND(2,3)+, OR(0,1)−, AND(0,1,2)−, OR(1,2,3)+,
  AND(0,3)−, OR(1,3)+, AND(0,1,3)+ and OR(0,2)−. Each is a different rule
  from V5's.
- **Fresh training replicates** with seeds 101–103 for each of: U0, U*, and
  U*-without-invention (U* with ρ = 0). L0 is the blind seed library.
- Libraries are frozen at test. Each runs 8 rules × 2 search seeds from the
  identity start, with budget 6. The final score is balanced discrimination
  on 8 held-out histories. Rows pair across libraries, giving 48 pairs.
- Below, "passes" means: wins > losses, one-sided sign test p < 0.05, and a
  higher mean.

**C1, the update rule is revised and the revision helps:** U* ≠ U0, and U*
passes against U0.

**C2, the system generates new kinds of move that help:**
- U* has ρ > 0;
- U* passes against U*-without-invention (the same rule, but no invention);
- the top-weighted term move is an invented one in at least 2 of the 3 U*
  replicates.

**C3, the gain carries over to an unseen world family:** U* passes against
L0 on the threshold-rule test, and U*'s mean exceeds the no-search identity
score.

**RSI V6 passes only if C1, C2 and C3 all pass.** Energy, survivors and the
invented moves are reported but not gated. A failure is reported as a
failure, with no rescoring or rerun of this test bank.

## Known limits

- The genes, including the evid ranking, are hand-written.
- Level 2 is a fixed search, and nothing revises it.
- The U space was extended (power, meanGain) after V5 failed and after the
  dev-bank checks above. That is design iteration across attempts. It is
  disclosed here and is why the test bank is fresh.
- The worlds have short phases, and flies do not die in them.
