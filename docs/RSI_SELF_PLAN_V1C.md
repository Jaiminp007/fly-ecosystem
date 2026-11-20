# RSI-SELF plan V1c — faithful-mix sandbox (clean ablation of the V1b failure)

Status: FROZEN 2026-10-30. New single authorized Phase-C attempt under its
own plan. V1/V1A/V1B stand preserved. No code, no bank, no worlds yet.
Further changes require V1d+.

## Diagnosis (read-only, zero new worlds, verified 2026-10-30)

V1b's sandbox fit each clone with live-mode updates only. The engine
(`taste-energy.mjs:348`, per-tick observe path):

```js
tasteUpdate(state,record,'live',emit);replay(state,emit);
```

plus a second full sweep after every motor update (`:262`). With BT
`replayPasses=4` over ~40 buffered records, taste-weight changes are
DOMINATED (~160:1) by replay-mode updates — and replay mode ignores the
surprise-gain boost (`:142` live-gated) and margin boost (`:147`
live-gated), the very knobs two of three menu items turn. V1b's sandbox
therefore measured a tiny, interaction-blind fraction of each config's true
effect: fair within live-mode, anti-predictive live. The harm mechanism is
structural — aggressive live configs can interact badly with replay in ways
a live-only sandbox cannot see.

## The one change (clean ablation)

V1c changes EXACTLY ONE thing: the sandbox fit replicates the agent's real
update mix. New exported helper `fitCloneV1c(clone, recs)`:

```
for (const rec of recs) { tasteUpdate(clone, rec, 'live', NOOP); replay(clone, NOOP); }
```

i.e., per fit-record: one live update + one full `replay()` sweep (4
passes, tournament draws, same code path as live — `replay` is exported).
Clone buffers (inherited live buffers incl. test recs) feed the sweeps,
same as live. Everything else UNCHANGED from V1b: menu, round-robin,
direction rule, adopt-threshold, skip rule, random-arm protocol, 6
checkpoints, test-error metric on the same 8 held-out recs, adoption
changes config only.

Billing (frozen): `fee = 2×(fitN×(1+passes) + testN)×(D+1)` with
`passes = max(1, config.replayPasses)` read at runtime; code asserts
`replayStrata===1` (shared base; fail-closed if the base ever changes). All
sandbox math stays on clones → live meter delta is exactly the fee.

Approximation disclosed: checkpoint buffers stand in for the historical
buffers each fit-record originally replayed against. Far more faithful than
live-only; not a perfect replay of history.

## Grid and bank

- 3 arms (selfmod/random/fixed) × 4 histories = 12 mains, 0 probes.
  Checkpoints, menu, arms, shared base: identical to V1b.
- Fresh dev bank `evidence/rsi-self-dev/fresh-03/`: 4 histories × 9 slots =
  36 seeds, range **398001–398036**. VERIFIED clean 2026-10-30 (zero exact
  tokens repo-wide). Spend 12 mains; other 24 slots reserved-excluded.
  fresh-01/fresh-02 untouched.
- Caps: ≤300 exec (12 used), ≤20e9 ops, ≤3600s wall. Single attempt;
  crash-resume only with dual provenance; no second attempt under V1c.

## Bars (same structure as V1b; interpretations updated)

- G1–G4: unchanged in content (12 mains exact ledger; 100% rule-match incl.
  round-robin; safety gap ≥ −0.15; liveness ≥2/≥2/≤4 of 24 slots).
- G5 persistence: unchanged (≥8 persistent agent-adopts, ≥2 items).
- G6 selection label: unchanged bands (±0.1 on selfmod−random).
- G7 fixtures (gate): 7 — choice/direction mapping; **faithful-mix executes
  (clone shows liveUpdates>0 AND replayUpdates>0, live weights untouched,
  fee exact)**; random applies blindly with logged flip; scorer V1c
  branches; bank + union-exclusion; hook bit-identity re-verified;
  full triage clean.
- Pre-registered interpretations: G3 pass (harmless or better) → mix was
  the bug; V1d may pursue selection signal. G3 still fails → the metric
  itself is blind (one-step error cannot see live dynamics even with
  faithful fit) → V1d must change the metric (multi-step/counterfactual)
  or close the selection line. Either outcome is publishable.
- Verdict GO ⟺ G1∧G2∧G3∧G4∧G5 + G6 label. No RSI claim under any outcome.
  GO licenses PROPOSING V1d, never executing one here.
