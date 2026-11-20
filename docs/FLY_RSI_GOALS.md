# Bounded fly-RSI (frozen 2026-11-18, before any L2 or L3 tuning)

**Bounded RSI for our flies, not general RSI.** Each level must be:
- done by the flies themselves, inside the world;
- driven by their own experience;
- shown on fresh seeds.

It is bounded because the menus, the meta-rules and the world are hand-written, and there are only two levels.

| Level | Claim | Evidence |
|---|---|---|
| L0 | Flies learn during life, and it helps | G4 (closed) |
| L1 | Flies improve their own learning program | G5 and G7c (closed) |
| **L2** | Flies improve **their own improver**: they retune the genes that control L1 revision (taste and movement cap, prune, z) from their own experience, beating evolution, a matched sham and no tuning | this document |
| **L3** | **Bounded compounding:** improving the improver makes L1 self-improvement pay at least 50% more | this document |

## World (opt-in `brainSwitch` {mul: [1, 12], switch: .001})

The energy cost of each brain feature switches during a fly's life between ×1 and ×12 of the base cost, with a mean dwell of 1000 ticks. The state is not inherited, and genes cannot know it. The fly feels it as its own brain's energy drain.

## Headroom H-L2 (practice seeds 101–116, Δ flies vs SELF)

Arms:
- **Lean package:** taste cap 9, prune 8, z 100; move cap 6, prune 8, z 100.
- **Full package:** the defaults.

| Arm | Δ flies |
|---|---|
| Always lean, mul [1, 12], switch .004 | −6.84 |
| Oracle (lean only in the costly state), [1, 12], .004 | +3.69 (16/16) |
| Same oracle fed a fake state, [1, 12], .004 | +1.78 |
| Oracle, [1, 20], .002 | +2.98 (fake state +.44) |
| **Oracle, [1, 12], .001** | **+3.05 (15/16); fake state −.83** (the chosen world) |

## Arms (`MV_SET=L2`; base SELF with the G7c movement reviser)

- **META** (`metaB: 'brainTrack'`): each tick the fly switches its reviser genes to the lean package when its felt brain cost is high, and to the full package otherwise. It is hand-written; its form may be tuned on practice.
- **SHAM:** the same rule fed an independent fake state with the same switching dynamics.
- **EVO-R:** at birth, with probability .1, the inherited package flips between lean and full. There is no in-life rule.
- **FIXED:** the full package always.
- **NOREV** (L3 reference): no L1 self-revision at all.

## Protocol

- Practice on the 48 seeds 101–116 and 301–332, with at most 5 attempts.
- A final is run only if practice clears every margin.
- The final runs once, on fresh seeds 95001–95048.

## Gates (one-sided sign-flip, p < .01)

**L2:**
- META − EVO-R ≥ 1.0;
- META − SHAM ≥ 1.0;
- META − FIXED > 0.

**L3:** per seed, d = (META − NOREV) − 1.5 × (FIXED − NOREV); require mean d > 0. In words, the L1 self-improvement gain with L2 must be at least 1.5× the L1 gain without L2.

## Labels

- The tuned genes are the L1 reviser's own settings (cap, pruning and evidence threshold for taste and movement). This is level 2 in the sense of this ladder.
- The meta-rule is hand-written, and the two packages come from the headroom oracle.
- The world was built so that the best reviser setting changes during life.
- The felt signal is noise-free.
- Not open-ended.

## L3b (frozen 2026-11-18, after L3 failed practice and before any L3b tuning)

L3 **stays NOT SHOWN** (best practice ratio 1.44 < 1.5, no final). L3b is a new, separately named test of the same claim.

**Allowed changes (practice only, at most 5 attempts):**
- the costly-state multiplier `brainSwitch.mul[1]`, chosen from {20, 30, 50}, with switch .001;
- the META rule's form.

The arms' definitions (META, SHAM, EVO-R, FIXED, NOREV) and both packages are as in L2.

**Selection.** The final runs only if a practice attempt clears the L3 gate and every L2 margin. It goes to the best L3 attempt.

**Final.** Fresh seeds 96001–96048, run once, all five arms.

**Gates** (one-sided sign-flip, p < .01):
- **L3b:** mean of d = (META − NOREV) − 1.5 × (FIXED − NOREV) > 0.
- **The L2 gates in the same world:** META − EVO-R ≥ 1.0, META − SHAM ≥ 1.0, META − FIXED > 0. All must pass, so compounding counts only where level 2 itself holds.

**Label.** The world's cost multiplier was chosen on practice to make level-1 self-revision costly without level 2. That choice is part of the constructed world.

## L3c (frozen 2026-11-18, after L3b failed practice with steady progress)

L3b **stays FAILED** (best practice ratio 1.444). Under the agreed workflow, a step back is required after 5 attempts *without progress*; L3b's attempts were still progressing, so the line continues as a new, separately named test.

- **World:** fixed at `brainSwitch` mul [1, 20], switch .001.
- **Allowed changes:** only the META rule's form (in-life reviser control), with at most 5 practice attempts. SHAM always runs the identical rule on a fake state. EVO-R gets the same gene packages. FIXED and NOREV are as in L2.
- **First new mechanism (attempt 1):** dormant features. When its brain becomes costly, the fly parks its added taste and movement features, with their weights, in cost-free storage. When the cost falls, it restores them.
- **Final:** fresh seeds 97001–97048, run once, all five arms. It runs only if practice clears every gate.
- **Gates:** as for L3b (the L3 ratio test plus the L2 gates, all at p < .01).

## L3-I: factorial amplification (frozen 2026-11-19, before any L3-I practice run)

Designed with GPT-6.2 Astra (advice only, [thread](t3-thread://v2/bad08e28-8c88-40fe-af57-ced9fd1ccf77/mcp:8e44d7f6-3728-4075-bccc-d22ecd4da085)). L3, L3b and L3c keep their recorded results.

**Claim** (ecological amplification): level-1 self-revision pays at least 1.5× more under the level-2 controller than without it, after removing the controller's own direct effect. The claim must hold on average **and** in a typical world.

This is not the narrower claim "the controller makes L1 discover better edits".

**World.** `brainSwitch` mul [1, 20], switch .001.

**Arms** (`microverse/l3i.mjs`, strains `L3I_*`):

| Arm | Program |
|---|---|
| META | brainTrack plus parking, the L3c attempt-3 setting: park added features and singles with \|w\| < 2 |
| SHAM | the identical controller on a fake cost state |
| EVO-R | evolving package; a lean-born fly gets the same parking at birth |
| FIXED | full package, no parking |
| NOREV | no L1 |
| METAOFF | the META controller with L1 structural revision disabled |

**Inheritance law** (all arms, `inheritFull`):
- A child inherits the parent's full repertoire (active plus parked masks), deduplicated, with no weights.
- An in-life controller's temporary package is reset to the stable full package before birth mutation. EVO-R's inherited package is kept.
- The birth audit passed: 431 births, 0 missing masks, 0 children carrying a temporary package.

**Scorer v2.**
- Paired one-sided sign-flip: exact for n ≤ 16; otherwise a Monte Carlo with 200,000 draws, using a `Math.imul` LCG and p = (exceedances + 1) / (draws + 1). Validated against exact enumeration: maximum error .0027.
- Exact binomial sign test, with zeros counted as non-wins.
- A missing arm result aborts the run; it is never treated as an extinction.
- Extinctions are reported by arm and by seed; none are excluded.

**Gates** (all must pass; p < .01; unrounded per-seed values):
1. **L2:** META − EVO-R ≥ 1.0; META − SHAM ≥ 1.0; META − FIXED > 0.
2. **Original L3:** mean d > 0, where d = (META − NOREV) − 1.5 (FIXED − NOREV).
3. **Factorial mean:** mean of f = d − (METAOFF − NOREV) > 0.
4. **Factorial sign:** f > 0 on ≥ 33/48 seeds (exact binomial p = .0066; 32/48 gives .0147).
5. **Ordinary L1 gain:** FIXED − NOREV > 0.

**Protocol.**
- **Screen 1 (parking):** exactly this configuration, no tuning; one practice run on 101–116 and 301–332. If it clears every gate on practice, it gets the one final.
- **Screen 2 (RewriteCost):** only if screen 1 misses. It needs its own registration, with numerical headroom bars and a 5-attempt budget, committed before its first measurement.
- An oracle can never qualify. Selection is never by the smaller p.

**Final bank.** 763001–763048, never used: a repo-wide search found these numbers only as incidental values inside runtime autosave files. It is run once. L3c's reserve, 97001–97048, stays untouched.

**Default world.** The fingerprint stays bdaca307…; every mechanism is opt-in.

### L3-I screen 2: RewriteCost (registration text by GPT-6.2 Astra, committed verbatim before any RewriteCost measurement)

**Trigger and claim.** Run only if Screen 1 misses a frozen practice gate (it did). RewriteCost tests whether a fly improves the return from structural revision by demanding stronger evidence for an expensive edit than for a cheap one. The world, the two prices, the cue and the mapping are hand-written. The cue is noise-free; the evidence that a particular edit is useful must come from the fly's own subsequent tastings. All parent L3-I gates, inheritance rules, practice seeds, scoring rules and the single shared final remain in force.

**1. World.** For Screen 2 only, replace `brainSwitch` with `rewriteCost`. No parking; ordinary feature maintenance stays at .0005 energy per active feature per tick.
- **Prices.** A committed taste swap costs **0.15** energy in the cheap state or **3.00** in the expensive state. That is 0.1 versus 2 full good bites, or 2.5 versus 50 ticks of basal metabolism.
- **No other fees.** Nomination, shadow evaluation and rejection are free. Ordinary L1 edits are unchanged.
- **State.** Each fly starts independently in either state with probability ½, and its state flips with probability **.002 per tick** (mean dwell 500 ticks). The fly feels its *current* rewrite price before the commit decision. It has no read of the future state, the true food valence, or its remaining lifetime.
- **Debit.** The real price is debited once, at commitment, after the triggering feeding update and before reproduction and death accounting. It is never waived for a low-energy fly. SHAM pays the real price too.

**2. Swap operator.** Taste only; ordinary taste and movement revision stay enabled in every L1-on arm.
- **When.** The new opportunity occurs **only where the existing full-cap check would return because no higher-order incumbent is weak enough to prune**. A founder singleton or the bias is never displaced.
- **Nomination.** The incumbent is the higher-order feature with the smallest |w|. The challenger is the absent feature from the existing one-bit-extension menu with the largest |ev|, and it must clear the existing strict `tasteZ * sqrt(s2)` threshold. Ties break by smallest numeric mask. No eligible pair means no trial.
- **Shadow.** One pending trial per fly. Clone the live taste predictor, put the challenger in the incumbent's slot at weight 0, and rebuild that slot's cached replay feature from each stored odor.
- **Scoring window.** Over the **next 16 actual tastings**, score the live and shadow predictors on each observed label **before** training either on it. Use ungated `modelProb`, clipped to [.001, .999], and binary log loss in nats.
- **Isolation.** Both predictors receive the same bites, reservoir choices and replay record indices. The shadow consumes no live RNG draws and never controls behavior. Ordinary live revision continues; if the live taste mask list changes before the verdict, the trial is cancelled. Death or the end of the run leaves an incomplete trial, not a win.
- **Verdict.** score = (Σ live loss − Σ shadow loss) / 16. After training on tasting 16, commit iff score > the current hurdle and the live mask list is unchanged.
- **Commit.** Install the shadow's mask list and fitted weights, rebuild live replay phi from its stored odors, and record the challenger as added. Live evidence, observation counts, replay records and confidence history are kept.
- **Rejection.** Discard the shadow. No pending trial or fitted weight passes to offspring.

**3. Gene and controls.** The only package difference is `swapHurdle`, in **nats per tasting**. Static grid: **{0, .025, .075, .15, NEVER}**, where NEVER never commits.

| Arm | Hurdle rule |
|---|---|
| META | **0 when cheap, .15 when expensive**, reading the cue at the verdict, not at nomination |
| SHAM | the identical rule on an independent private state chain with the same initial distribution, transition probability and tick clock |
| EVO-R | founders start at the stable hurdle .075; at each birth, with probability .1, the inherited hurdle mutates to a different grid member chosen uniformly; no in-life tracking |
| FIXED | the strongest static hurdle selected in stage C |

All L1-on arms get the same operator, evidence, shadow window and real prices. There are no other treatment-specific genes or package changes.

**4. Advancement and budget.**
- Stages A–C use seeds **101–116**, paired by seed. Population means the existing late-population endpoint; all seeds, extinctions included, count.
- These are engineering advance bars, not claims of significance. Stages run in order and stop at the first miss.

| Stage | Frozen comparison | Advance only if |
|---|---|---|
| **A. Hidden challengers** | Switching world, hurdle NEVER; shadows observe but never commit. Per seed, the denominator is **all** otherwise-blocked full-cap checks with no trial already pending. The numerator is the trials started at those checks that complete with score > 0; no nominee, cancellations and deaths count zero. | **At least 10%** on **at least 12/16 seeds**, with **at least 20 denominator checks** on each qualifying seed. Checks, nominations, cancellations, deaths, completions and wins are reported separately. |
| **B. Payoff reversal** | Four cells: constant cheap or constant expensive price × static hurdle 0 or .15. | Mean paired flies: **cheap, hurdle 0 − hurdle .15 ≥ 1.0**, and **expensive, hurdle .15 − hurdle 0 ≥ 1.0**. Both directions must clear independently; a large effect in one cannot cover a miss in the other. |
| **C. Switching payoff** | The actual switching world: the implementable tracker and **all five** static hurdles. The static hurdle with the highest 16-seed mean is selected (exact tie: the higher hurdle, with NEVER highest) and locked as FIXED before stage D. | The tracker beats that best static hurdle by **at least 2.0 mean paired flies** and wins on **at least 12/16 seeds**. |
| **D. Qualification** | The six locked arms on 101–116 and 301–332, one 48-seed practice run. | Every frozen L3-I gate passes, and so does the off-arm identity check below. Only then does RewriteCost get the single shared final. |

- A pre-specified multi-arm batch counts as one attempt, not one per cell.
- **Four attempts are authorized under the five-attempt ceiling; the fifth is deliberately unused.**
- No alternative price, dwell, hurdle, window, denominator or seed batch may be substituted after a miss. No practice rerun to select a smaller p-value.

**5. Off-arm identity and preflight.**
- **Inert hurdle.** The hurdle's **only consumer** is the new L1 swap verdict. With `tasteRevise = moveRevise = null`, neither METAOFF nor NOREV may nominate, allocate a shadow, commit, pay a fee, alter a mask, or change a birth-mutation input through the hurdle. Both still do ordinary L0 learning and ordinary birth mutation.
- **Dedicated RNG streams.** Real and fake state paths use dedicated streams keyed by world seed, fly ID and stream tag. Sensing or updating the hurdle never advances a world, action, learning or mutation RNG.
- **Clean off arms.** The transient hurdle is reset before inheritance. Neither off arm has `brainTrack`, parking or any other package field.
- **Lockstep check.** Before measuring stage A, run an off-arm lockstep on practice seed 101 for 20,000 ticks, and repeat the identity assertion for every stage-D seed. Compare, tick by tick: ecological state, actions, energy, births and deaths, inherited repertoires, live masks, weights and evidence, and behavioral RNG states. Only arm identifiers and inert controller telemetry are excluded.
- **Required result.** **Zero divergent ticks, zero swaps and zero rewrite debit** in both arms; equal final populations alone do not pass. With this invariant, f = d per seed by construction, and any discrepancy is an implementation error, not a result.
- The default-world fingerprint must remain bdaca307….

## L3-II: attention-limited structural revision (registration text by GPT-6.2 Astra, committed verbatim before any L3-II measurement)

**Claim.** A fly can increase the ecological payoff of L1 revision by using a private bodily cue to decide **which structural evidence to collect**. The scarce resource is one evidence channel per tasting, not energy, active feature slots, or permission to edit. The cue identifies neither a useful mask nor food valence. Only L1 can turn the routed observations into a feature. L3-II is a new test; no earlier result is rescored.

### 1. World and chemistry

- **Base world.** The existing 40×40 world, 20,000 ticks, energy prices, ordinary label noise, 16 food kinds, balanced odor-code redraw every 100 ticks, and rule epochs of 3,000 ticks.
- **Disabled.** `brainSwitch`, parking, RewriteCost, `senseDrift`, and the other niche mechanisms.
- **New rule family, `bankPairs` (opt-in).** The existing families draw from all eight bits and do not guarantee a learnable target in each bank.

Bank A is bits 0–3; bank B is bits 4–7. At each epoch, draw one of the six unordered pairs uniformly from each bank, independent signs a, b ∈ {−1, +1}, and an independent overall sign s. The rule is frozen for the epoch:

```text
valence(x) = s × sign(0.5 + a × walsh(pairA,x) + b × walsh(pairB,x))
```

Both pairs can change the answer, neither is sufficient, and their roles are symmetric. The existing balanced code generator is kept; not every 16-kind draw needs to be equally easy. A code redraw does **not** reset the rule, the evidence or the fly.

### 2. Private receptor and evidence budget

**Receptor state.**
- Each fly has a private, non-inherited reliable bank, initially A or B with equal probability.
- It flips with probability **.004 per world tick** (mean dwell 250 ticks), once per tick whether or not the fly eats.
- At each actual tasting the fly feels a receptor-quality cue that names the reliable bank correctly with probability **.90**, independently given the current state. This makes an oracle instrument and an implementable tracker genuinely different.
- The controller receives the cue, never the latent state or a corruption mask.

**Corruption applies to structural evidence only.**
- L0 perceives the usual clean odor, predicts, receives the usual noisy taste label, and trains weights and replays as today. Feeding, smell-guided movement and the prediction residual all use the ordinary perception.
- For L1's evidence sample, the reliable bank's bits are copied correctly, and each bit of the unreliable bank is independently flipped with probability **q = .5** per tasting. An unreliable pair therefore contributes noise, not a stable inverted signal that `abs(ev)` could still exploit.
- The router chooses **before** it sees the current label, residual or structural sample. Neither it nor the cue-blind controls may compare the structural copy with the clean L0 odor.
- Label: **constructed noisy structural sensor, intact L0 sensor, hand-written controller.**

**One family means 15 mask correlations.** A owns the nonzero masks wholly inside `0x0F`; B owns the nonzero masks wholly inside `0xF0`. The bias and mixed-bank masks belong to neither. Mixed masks remain legal under ordinary birth mutation and L0 weight learning, but are not L1 admission candidates in any arm. Each tasting yields exactly one routed sample. With D = 1 − 1/tasteMemory and the ordinary pre-update residual r:

```text
Both banks:   ev[k] ← D × ev[k]          S[bank] ← D × S[bank]
Routed only:  ev[k] += walsh(k, structural_sample) × r
              S[bank] += r²              (once per taste, not once per mask)
```

Decay without a fresh correlation is bookkeeping, not a second observation.

**Admission.**
- The existing revision clock (counted in **total tastings**), cap, pruning and one-bit-extension rule are kept.
- At an admission check, consider the eligible absent extensions in either bank with S > 0. Rank them by `abs(ev[k])/sqrt(S[bank])`, ties to the smallest numeric mask, and admit only if the winning score strictly exceeds `tasteZ`.
- Do **not** rank by raw evidence or use the global `s2`: either would change the effective hurdle merely because a bank received more samples.
- L0 and movement L1 are otherwise unchanged.

### 3. Arms and inheritance

**Background.** The ordinary evidence-revising SELF background, normal mutation and `moveAddInit: 2`.
- **The new L2 gene** is `attentionA`, the probability of routing the next tasting to A.
- **Static grid:** {0, .25, .5, .75, 1}; static interior allocations draw independently on each tasting.
- No arm gets extra correlations, free target masks, or changes to taste acceptance.

| Arm | Routing rule |
|---|---|
| **ORACLE** | Measuring instrument only: sets `attentionA` to 1 or 0 from the true current reliable bank. No access to the rule, the target or the label. |
| **META** | Sets `attentionA` to 1 when the current felt cue says A, else 0. No smoothing or tuning. |
| **SHAM** | The identical META code, driven by an independent fake bank chain with the same initialization, tick transitions and .90 cue accuracy relative to the **fake** state. Structural corruption still follows the real state. |
| **EVO-R** | Founders start at .5. At each birth, with probability .1, the inherited allocation is replaced by a uniformly chosen *different* grid value. No in-life cue use. |
| **FIXED** | The static allocation selected and locked in stage A. No in-life tuning. |
| **NOREV / METAOFF** | Both disable taste and movement structural revision, keeping L0 and normal birth mutation. METAOFF computes META's allocation but has no structural consumer; NOREV does not route. |
| **BLIND** | The cue-blind scheduler below: a mandatory comparator in stages A and B, not a seventh final arm. |

**BLIND uses evidence; it is not a coin disguised as a control.**
- Bank utilities start at zero. Before a tasting, BLIND exploits the higher-utility bank with probability .8 and otherwise samples uniformly; utility ties break uniformly.
- Before updating the selected bank, it nominates that bank's strongest of six pair correlations by prior `abs(ev)`, ties to the smallest mask.
- After receiving the routed sample and residual, it updates only that bank's utility: `U ← .8 U + .2 sign(ev_before[k]) × walsh(k, sample) × r`, with sign(0) = 0. This rewards a bank when a correlation learned on **previous** bites predicts the sign of a new residual.
- No current-bite lookahead, no second-bank sample. Utilities and receptor states start fresh at birth.

**Inheritance.**
- L3-I's repertoire inheritance applies, without fitted weights.
- Where the existing model inherits structural evidence, each bank's `ev` is inherited **together with its matching S**, and the revision clock is preserved. One side of that normalization is never inherited alone.
- A controller's temporary `attentionA` is reset to the stable .5 before birth mutation; EVO-R keeps its genuine allele.
- The real state, fake state, cue error, corruption, routing and exploration, and allocation mutation use domain-separated streams, never the world, action or L0 replay RNG.

### 4. Endpoints and ordered screens

**Population** is the existing per-seed mean population over ticks 10,100–20,000 at 100-tick intervals, extinction zeros included.

**Future-bite prediction** is a separate common-input assay, so that a policy cannot look more accurate just by eating easier food.
- **Tape.** For each screening seed, record one NOREV reference world's actual tasting tape: fly ID, birth tick, tasting tick, ordinary odor and observed noisy label.
- **Replay.** Replay each fly's tape through independent founder-initialized taste learners, one per comparator, with no inherited evidence in this assay. The private receptor path, the structural noise and the L0 replay choices are shared across comparators for that fly.
- **Scoring.** Score the ordinary **ungated** `modelProb` on each bite *before* that bite updates anything, clipped to [.001, .999], as binary log loss in nats. Average over actual bites within a seed, then equally over seeds. No sampling by survival, admission or cue correctness. An empty tape fails the screen.
- The assay is diagnostic; only autonomous population runs can qualify a fly.

| Stage | Frozen comparison | Advance bar |
|---|---|---|
| **A. Routing headroom** | Seeds **101–116**. ORACLE vs all five static allocations and BLIND, in the tape assay and in autonomous worlds. FIXED is locked as the static allocation with the highest mean **population**; on an exact tie, the one closest to .5, then the lower allocation. | ORACLE beats **every static allocation and BLIND** by **≥ .01 nats/bite** lower mean loss and **≥ 2.0 late flies** higher mean population. It beats the locked FIXED and BLIND in population on **≥ 12/16** seeds each. |
| **B. Implementable routing** | Seeds **301–316**, not used in A. The actual noisy-cue META vs the locked FIXED and BLIND, on the same two endpoints. No oracle substitution or static reselection. | Against **each** comparator: **≥ .005 nats/bite** lower mean loss, **≥ 1.0 fly** higher mean population, and a positive population contrast on **≥ 11/16** seeds. |
| **C. Qualification** | The six locked arms on all 48 practice seeds, 101–116 and 301–332. BLIND is gated in A and B; no fresh-seed superiority over BLIND is claimed. | Every L3-I gate below passes, and so does the off-arm identity check. Only this real META may go to the final. |

- These are three pre-specified batches, **not three tuning rounds**. Stop at the first miss.
- Three attempts are authorized under the five-attempt ceiling. No retries, and no alternative dwell, corruption, chemistry, hurdle or scheduler.
- Reusing the stage A and B practice seeds in stage C is practice, not independent confirmation.

### 5. Qualification, integrity and final

**Gates.** Scorer v2 and every L3-I gate, on unrounded, seed-paired values, all at one-sided p < .01 under the parent protocol:
- META − EVO-R ≥ 1;
- META − SHAM ≥ 1;
- META − FIXED > 0;
- mean d = (META − NOREV) − 1.5 (FIXED − NOREV) > 0;
- mean f = d − (METAOFF − NOREV) > 0, with f > 0 on **≥ 33/48** seeds;
- FIXED − NOREV > 0.

Extinctions are reported by arm and by seed and never excluded. A missing or non-finite arm result is invalid, not an extinction.

**Integrity checks before stage A.**
- On fixtures, verify that each routed bite adds exactly 15 fresh correlations, that the other bank only decays, and that changing only the cue or the corruption cannot change the current bite's L0 update.
- Run **METAOFF vs NOREV** in tickwise lockstep on seed 101 for 20,000 ticks, and repeat on every stage C seed. Require zero divergence in ecological trajectory, masks, weights, evidence, offspring and behavioral RNG, excluding only inert controller telemetry. Accordingly f = d, seed by seed.
- Preserve the default fingerprint bdaca307….
- Report route counts, the true-bank match rate, admissions by bank and the bites after each admission; none of these selects a configuration.

**Final bank.** The proposed bank is **852001–852048**.
- Reserve it only after a repo-wide **interval-overlap** audit against spent and reserved ranges and run artifacts, not just a search for the two endpoints.
- If there is an overlap, commit a replacement **before any L3-II measurement**.
- Freeze the resolved configuration, scorer and bank manifest.
- If stage C passes, run the six arms once on that bank; otherwise run no final. The earlier reserved banks stay untouched.

**Bank audit (done before commit).** A repo-wide search for 852001–852048 found only incidental values inside runtime autosave JSON (`handoff/runtime-snapshot/…/autosave.json`, `runs/platform/…/autosave.json`). They are not seeds. The ledger and run artifacts in `docs/SPENT_BANKS_RSI.md` contain no 6-digit ranges overlapping it. The bank is reserved.

### L3-II addenda (frozen before reading stage A; text by GPT-6.2 Astra)

**Post-mortem budget (verbatim).** On a Stage A miss, L3-II stops. No additional seeds, simulation runs, tape regeneration, parameter changes or alternative gates. From the original Stage A artifact, report ORACLE's paired tape-loss advantage and late-population advantage against **each** static allocation and BLIND, plus its population win counts against locked FIXED and BLIND. Identify the comparator and shortfall for each missed bar; do not assume the best population static is also the best tape static. Report registered mechanism telemetry only where retained. No post-mortem result permits Stage B.

**Implementation disclosure.** ORACLE, META and SHAM choose the bank directly; only the static and EVO-R branches read `genes.attentionA`.
- **For stage A** this is behaviorally equivalent for each bite, so stage A remains a valid oracle-routing headroom measurement.
- **Before any stage B**, the controller must set `attentionA` (to 0 or 1), with the temporary value reset before birth mutation. Scripted births and tastings must show identical routes and RNG consumption, with EVO-R's allele preserved.
- Until then, "the fly retuned its reviser's allocation setting" is not claimed as implemented.

**Telemetry not retained by the stage A runner:** route counts, true-bank match rate, admissions by bank, bites after admission, per-arm extinction flags, and epoch-relative latency. These are reported as **not retained**, not as zero, and are not inferred. Every expected seed × arm value is checked for finiteness before the verdict is accepted.

## L3-III: Evidence-routed attention (registration text by GPT-6.2 Astra, committed verbatim before any L3-III measurement)

**Claim and prior exposure.** A fly can make L1 structural revision pay at least 1.5 times as much by using its own past prediction errors to set its reviser’s attention allocation. L3-III is a new test, motivated by the L3-II practice result: on seeds 101–116, BLIND averaged 56.91 late flies versus 56.00 for S50. Those seeds were seen when choosing this hypothesis. They are not independent confirmation. The autonomous NOREV population contrast needed to evaluate compounding was not measured there. L3-II remains closed; no old result is rescored. [FLY_RSI_LOG.md:164-191](file:///C:/Users/nisar/fly-ecosystem/docs/FLY_RSI_LOG.md)

### 1. World and intervention

**Keep `L3II_WORLD` unchanged.** Retain `bankPairs`, the 3,000-tick epochs, 100-tick odor redraws, one structural bank per tasting, private receptor switch probability `.004` per tick, corruption `q=.5`, and `.90` cue accuracy. Keep the existing L0 learner, movement reviser, within-bank normalization, mutation, inheritance and energy accounting. **No L3-III controller reads the bodily cue, true receptor state, rule targets or valence.** Continue consuming the existing cue, corruption and routing draws in their original order. Labels: **constructed noisy structural sensor; hand-written evidence controller; no direct energy reward for routing.**

**META is exactly the former BLIND policy, with an explicit gene write.** Utilities start at zero at birth. Before each tasting, use the existing two routing draws: exploit the larger utility with probability `.8`, otherwise choose uniformly; break utility ties uniformly. Write `genes.attentionA = 1` for the selected A bank or `0` for B. The common allocation reader routes from that gene, with **no third draw**. On the chosen bank nominate the strongest of its six pair correlations by prior `abs(ev)`, tie to the smallest numeric mask. Save its pre-increment sign. After the actual observation, update only the chosen utility:

```text
z = sign(ev_before[k]) × walsh(k, structural_sample) × pre_update_residual
U[chosen] = .8 × U[chosen] + .2 × z
```

`sign(0)=0`. The current observation cannot affect its own routing. Reset the controller’s transient allocation to `.5` **on the offspring copy before birth mutation**; never reset the living parent. No fitted weights, utilities or receptor states pass to offspring. Keep the registered inheritance of masks, evidence, matching bank normalizers and revision clock. [sim.mjs:185-209](file:///C:/Users/nisar/fly-ecosystem/microverse/sim.mjs) [FLY_RSI_GOALS.md:263-273](file:///C:/Users/nisar/fly-ecosystem/docs/FLY_RSI_GOALS.md)

### 2. SHAM: an independent sensory twin

**Yoke the opportunities, not the recipient’s residual.** On every actual SHAM tasting, the real L0 learner and real L1 reviser receive the recipient’s ordinary observation and actual routed structural sample, exactly as for META. Only the scalar `z` entering the utility update is replaced. Do not shuffle the recipient’s residuals, reverse bank names, or multiply its own update by coin flips.

- **Donor input.** For each experimental seed, produce one sacrificial NOREV world using the same world generator and a fixed `L3III_DONOR` RNG domain, independent of all scored arms. It is an instrument belonging to that seed, not an extra scored seed. Record each donor fly’s chronological sequence of clean odors and observed noisy labels. Never pool across experimental seeds, use outcomes from a scored arm, or select donors by prediction loss, route, fitness or receptor state.
- **Yoking rule.** Each SHAM newborn has a dedicated donor-selection stream keyed by experimental seed and recipient ID. Draw uniformly, with replacement, from donor flies with at least one recorded tasting. Consume that fly’s tape from its first bite in order, **one donor bite per real recipient bite**. If exhausted, draw another tape by the same rule. No lookahead, length matching, or choice of a particularly successful donor. An empty donor library is an invalid run.
- **Twin learner.** Start one private founder-initialized taste learner per recipient, with zero evidence and utilities. Give it an independent receptor chain with the registered initial distribution and `.004` tick dynamics, advanced on the recipient’s age clock, and independent corruption and L0 replay streams. On a recipient bite the twin processes the next donor odor and label **in the bank the SHAM controller actually selected**. Compute `z′` using the twin’s own nominated pair, prior evidence sign, corrupted donor sample and pre-update L0 residual. Update the controller by the identical `.8/.2` rule with `z′` in place of `z`. Train the twin normally on that donor bite. Keep the twin’s learner and receptor continuous across donor tape boundaries. The twin never feeds, moves, revises or pays costs on behalf of the real fly.
- **What is and is not matched.** Update times, bank choice, exploration, learning rule, corruption law and persistence of the utility accumulator are matched. The donor has genuine bite sequences, but its diet, ancestry and tape boundaries do **not** reproduce the recipient’s lifetime exactly. Report donor-tape joins per 100 recipient bites, innovation RMS, lag-one correlation of successive innovations **within the same bank**, and route-run lengths for META and SHAM. Include counts; undefined correlations are reported as undefined. Do not tune the donor after inspecting these. A pass supports own experience over **this specified independent sensory-twin sham**, not over every possible sham.

**Mandatory wiring fixture:** hold donor tape, twin state, bank and RNG fixed. Changing only the recipient’s current residual or corrupted bits must not change `z′`; changing only the donor observation must not change the real L0 update or the real L1 evidence increment on that bite. On an identical scripted donor/recipient history with identical learner initializations and receptor draws, `z′` must reproduce META’s `z` bite for bite. These checks distinguish a decorrelated control from a broken or inadvertently weakened one.

### 3. Other arms and integrity

- **EVO-R:** retain L3-II’s genuinely inherited static allele on `{0,.25,.5,.75,1}`, founder `.5`, birth mutation probability `.1` to a uniformly chosen different allele. **FIXED** uses the static allele selected in stage A. Neither updates utilities in life.
- **METAOFF / NOREV:** disable both taste and movement structural revision; keep ordinary L0 and normal birth mutation. METAOFF runs the controller on its dedicated streams and writes its temporary allocation, but there is no structural consumer. With no L1 evidence to nominate a nonzero-sign pair, its utility innovation is zero. Do not turn evidence accumulation back on just to make METAOFF look active. NOREV does not route.
- **Before stage A:** verify default fingerprint `bdaca307…`; reproduce former BLIND’s routes, live updates and RNG consumption on scripted tastings including ties and exploration; test that controller offspring start from `.5` while EVO-R offspring inherit their real allele before mutation. Run the SHAM wiring fixtures and the registered METAOFF/NOREV ecological lockstep on seed 101. Require zero divergent ticks over 20,000 ticks, apart from inert controller telemetry. Repeat the identity assertion for all qualification and final seeds. A mismatch is an implementation failure, not a contrast to score.

### 4. Ordered practice stages

Only **101–116 and 301–332** are authorized practice seeds. **Do not use 401–416.** The two sets below are disjoint for static selection and feasibility. Call them unused for the respective **L3-III decision**, not never-used worlds. The 48-seed qualification deliberately reuses practice data; only the final confirms the claim.

| Stage | Run and decision |
|---|---|
| **A. Re-lock FIXED** | On **301–316**, run all five static alleles. Select the highest unrounded mean late population; exact tie → closest to `.5`, then lower allele. Commit the selected allele and resolved arm manifests before B. S50 has no preferred status. No META result enters selection. |
| **B. Feasibility** | On **317–332**, run **META, locked FIXED and NOREV**. For each seed compute `g = FIXED − NOREV`, `m = META − FIXED`, and `d = m − .5g`. Advance only if **mean `g > 0`**, **mean `d > 0`**, and **`d > 0` on at least 9/16 seeds**. Otherwise stop. These are screening bars, not significance tests. No requirement that `m ≥ 1`: the one-fly L2 margins are against SHAM and EVO-R, not FIXED. Stage B cannot establish those margins or qualify a final. |
| **C. Qualification** | Run the six locked arms on **101–116 and 301–332**. Apply every gate below to the entire 48-seed suite. Do not drop the exposed 101–116 subset or present the 48 as a holdout. Report the three 16-seed blocks separately as descriptive results only. |

One prespecified multi-arm batch is one attempt. **Three attempts authorized under the five-attempt ceiling; two deliberately unused.** Stop on the first missed advance bar. No alternate donor, dwell, utility rule, static re-selection, extra practice block, or retry. If a technical defect invalidates a run, publish the defect; no silent replacement under this registration.

### 5. Gates, records and final

Endpoint: mean population over ticks 10,100–20,000 at 100-tick intervals, extinction zeros included. Use scorer v2, unrounded paired seed values, one-sided `p < .01`, and the parent sign-test convention that zeros are non-wins. **All gates must pass on practice and again on the final:**

1. META−EVO-R ≥ 1.0; META−SHAM ≥ 1.0; META−FIXED > 0; each significant.
2. Mean `d = (META−NOREV) − 1.5(FIXED−NOREV) > 0`, significant.
3. Mean `f = d − (METAOFF−NOREV) > 0`, significant; `f > 0` on **at least 33/48** seeds.
4. Mean `FIXED−NOREV > 0`, significant.

With off-arm identity, `f = d` seed by seed. Preserve the per-seed outcomes that verify it. Record extinction from the actual world by arm and seed; a missing or nonfinite result is invalid, not extinction. Save route counts, true-bank match rate, bank admissions, bites after admissions, donor diagnostics and resolved configuration **in worker outputs**, separately by seed and arm. These describe mechanism; none changes a gate. No cue oracle or tape-loss result can qualify the experiment. [FLY_RSI_GOALS.md:295-311](file:///C:/Users/nisar/fly-ecosystem/docs/FLY_RSI_GOALS.md)

**Proposed final bank: `874001–874048`, subject to audit before measurement.** Do not reuse `97001–97048`, `763001–763048` or `852001–852048`. A documentation text search is not a bank audit: verify interval overlap against ledgers, manifests and run artifacts, including ranges enclosing the candidate block without naming either endpoint. Commit the verified bank before any L3-III measurement; if occupied, commit a different verified block first. After C passes, freeze code, scorer, donor generator and arm manifests. Run the final bank **once**. Otherwise leave it untouched.

**Bank audit (done before commit).** An interval-overlap scan of every text artifact in the repo (16,375 .md/.json/.mjs/.js/.txt/.py/.csv/.ts files outside `.git`, `node_modules`, the Python venv and runtime autosaves) parsed every numeric range (`a–b`, `a-b`, `a..b`, `a to b`, including abbreviated upper ends) and every bare 6-digit value. No range overlaps or encloses 874001–874048, and no value falls inside it. The bank is reserved.

**Astra's pre-registration prediction (not part of the registration):** about 10% to clear practice and one fresh final; most likely outcome a stage-B stop.

## L3-IV-H0: four-bank routing headroom (registration text by GPT-6.2 Astra, committed verbatim before any four-bank measurement)

*Origin: design proposed by Gemini 4 Neon (second advisor), cross-examined and rewritten by GPT-6.2 Astra. Astra's odds for the whole line (stage 0, practice, one fresh final): 15–25%, a planning estimate. Gemini's were 45–55%.*

**Status and claim.** This is a practice-only feasibility screen, registered before any four-bank population or prediction measurement. Previous two-bank exploratory results on 101–104 are disclosed motivation, not stage-0 observations. H0 asks whether an explicit, privileged **routing policy** can beat a strong static allocation by more than half the ordinary L1 gain, with margin and consistency across seeds. It is not an L2 or L3 test, cannot qualify a final, and reserves no final bank.

**World.** Use the ordinary 40×40, 20,000-tick ecology, 16 balanced odor kinds, redraw every 100 ticks and rule epoch every 3,000 ticks. Replace the odor with 16 ±1 bits in four labeled banks of four. In each epoch independently choose one of the six within-bank pairs per bank, four independent coefficient signs and an independent overall sign. Valence is `s × sign(.5 + Σ a[b] × walsh(pair[b], odor))`. Use the ordinary label noise, brain maintenance and feeding rules. The **only** world variants are toxin `.60` and `.85`. Disable parking, rewrite cost and brain-cost switching.

The private reliable bank is uniform at birth. Each fly-tick, with probability `.004`, switch uniformly to one of the **other three** banks. On a tasting the structural copy preserves that bank and flips each of the other 12 bits independently with probability `.5`. The bodily cue names the correct bank with probability `.90`, otherwise a uniformly selected wrong bank. It is generated but **not used by any H0 decision arm**. L0 predicts, acts and learns from the ordinary odor and label. Label: constructed noisy structural sensor, privileged routing instrument, no energy subsidy for correct routing.

**Brain and birth.** Ordinary founders start with bias plus all 16 singletons; taste cap 24. Keep movement L1 and the other ordinary SELF settings. Allocate 60 structural evidence entries, 15 nonzero within each bank. Mixed masks remain legal in L0 and birth mutation but cannot be admitted by L1. One bank per taste; update its 15 correlations and its `S` exactly as in L3-II, decay all four banks, preserve the total-tastings revision clock, and admit by strict `|ev|/sqrt(S[bank]) > tasteZ`, ties to smallest mask. Inherit masks and matching evidence/normalizers but not fitted weights, receptor state or BLIND utilities.

Retain the ordinary mutation event rates. For a proposed taste-mask addition use the following prior, identical in all arms: probability `1/256` null proposal, `30/256` uniform over the 60 nonzero within-bank masks, and `225/256` uniform over all 16-bit masks touching at least two banks. Keep ordinary duplicate and cap checks. This preserves the two-bank prior mass on structurally accessible masks and, before duplicate checks, the chance of proposing a current target pair: `(30/256) × (4/60) = 2/256`. It does not give mutation the rule.

**Arms.**

- **NOREV:** no taste or movement structural revision. Ordinary L0, mutation, inheritance and ecology remain on.
- **STATIC:** run every allocation `(n0,n1,n2,n3)/4` with nonnegative integer entries summing to four, plus the four uniform allocations on three-bank subsets: **39 distinct policies**. Sample independently per tasting. This includes every labeled singleton, every half-half pair, uniform four-way, and unequal allocations. Any later EVO-R must be able to evolve the same menu.
- **ORACLE:** route every tasting to the fly’s current true reliable bank. Never read target identity, food valence or future state. All other learning, inheritance, costs and starting masks match STATIC.
- **BLIND:** four-bank analogue of L3-II BLIND. Exploit the highest utility with probability `.8`, break ties uniformly, otherwise explore uniformly across all four banks. Use the same prior-evidence pair nomination, pre-increment sign and `.8/.2` utility update. No cue, latent state or second sample.
- **TRUE_ORACLE:** diagnostic only. At birth replace taste masks with bias plus the four current true pairs; start with ordinary zero taste weights, ordinary L0 and movement L1, no taste structural revision, and no privileged refresh during life. Report its different starting feature count and maintenance cost. It never advances or eliminates a variant.

**Execution and selection.** Run both toxin variants on **101–116 only**, one complete, predefined batch per variant. Primary endpoint: mean live population at ticks 10,100 through 20,000 inclusive, every 100 ticks, extinction zeros included. For each toxin value, `F` is the **single static allocation with highest mean population over the 16 seeds**; never choose a different static per seed. Exact tie: nearest uniform by squared Euclidean distance, then lexicographically smallest allocation vector in bank order 0–3. For each seed compute `g = F − NOREV`, `dO = (ORACLE − F) − .5g`, and `b = ORACLE − BLIND`.

A toxin variant passes only if **all** hold on unrounded results:

1. Mean `g ≥ 3.0`; NOREV goes extinct on at most **1/16** seeds.
2. Mean `dO ≥ 4.0`; `dO > 0` on at least **13/16** seeds.
3. Mean `b ≥ 4.0`; `b > 0` on at least **12/16** seeds.

These are selection bars, not p-values. Report both batches in full. If `.60` passes, **choose `.60` even if `.85` looks better**. Otherwise choose `.85` only if it passes. If neither passes, stop. Report `α = mean(g)/mean(TRUE_ORACLE−NOREV)` when the denominator is positive; otherwise report it as undefined. **No α gate.** No third toxin, alternate bank count, static-menu change, rerun, or post-hoc exclusion. These two batches count against the five-attempt line budget; a later registration has at most three practice batches remaining.

**Integrity and records.** Before measurement, preserve the default fingerprint `bdaca307…`; verify banks 2 and 3 affect valence, prediction, replay and admission, not only the chemistry generator. Test all four routing labels, exactly 15 fresh correlations per tasting, zero outside the routed bank beyond decay, and identical current-bite L0 updates under different routing. Verify that three unreliable banks get **12 independent corruption draws**, not four reused flips. Preserve dedicated RNG streams and the mutation prior above. The current simulator has global eight-bit assumptions in code generation, candidate extensions and mutation; do not implement this by merely changing `ODOR_BITS` and allocating 65,536 evidence entries per fly.

Archive finite per-seed arm endpoints, actual extinctions, selected static, route counts, true-bank matches, correct-pair admissions versus all admissions, and whether correct pairs were already present at birth. Mark missing data invalid, not extinction. Target identity is available to the rule generator, TRUE_ORACLE and **read-only telemetry only**. No H0 result, however large, authorizes a final; it authorizes at most a separately committed test of the **noisy-cue fly**.
