# RSI C16 PLAN V1 (cause-gated transfer: infer the new cause, switch once) — FROZEN

Date: 2026-11-02. Status: FROZEN before code. Rationale license:
R366 (Song extinction-as-new-cause-inference + Lu/LCNet shared-vs-
context + ConFER renewal) + transfer-map family #1 (inference-gating,
first candidate rationale) + R371 (arbitration-failure lens, Hafez
reliability-arbitration). First line to test a TRANSFER-SIDE rationale
outside revision-adds-value (C15 closed revision×working; C16-bar met:
no menu/proposal/sandbox/fee anywhere — pure transfer-side switch).

## C16-bar ruling (recorded)

Cause-gated transfer QUALIFIES: new causal question (does explicit
new-cause inference with a single discrete switch lift HB transfer?),
not a fire/menu/match/schedule variation (no loop fires, no menu exists,
no transplant scaling). Both branches move the program (GO licenses
harder-gap inference lines + feeds DTR's inference-head design with
in-vivo evidence; NOGO closes family #1's simplest form and redirects
to family #2-variants with dissimilar pseudos or input-side work).
Falsifiable both ways — the scoping standard.

## Mechanism (pre-registered, implementable, agent-side)

On TRANSFER rows only, the run maintains a binary latent cause:
OLD (train codebook) vs NEW. Starts OLD (prior). Each contact outcome
updates a log-odds score L (starts 0): +1 per confirming contact
(pain where avoided, safe where cruised), −2 per surprising contact
(pain where cruised, safe where avoided). When L ≤ −K (threshold K=8,
pre-registered), cause switches to NEW once (irreversible within the
run): all subsequent cue-valence observations are negated agent-side
(interpretFlip flag on the learner; null-default absent = bit-identical).
No switch → row runs as static lossy (mechanism absent, recorded).
Direction-first: the switch is driven by HB-generated surprise (safe
contacts on avoided cues) and its effect is HB extinction; BH acquisition
is measured separately (must not degrade).

## Design (seg-chain, 2 chains × 8 runs = 16 mains, 0 probes)

Per chain (H0/H1/H2), lossy transplant α=0.25 throughout (working
baseline — lift measured OVER it, C15 lesson), single fire-tick 1024
for the cause vote (switch evaluated once at tick 1024 on accumulated
L; no continuous switching — one discrete decision):
- `switch-*`: lossy transplant, cause-gate ON (switch iff L ≤ −8 @1024).
- `static-*`: lossy transplant, cause-gate OFF (the lossy baseline —
  G2a measures OVER this, not over exact).
- `exact-switch-*`: EXACT transplant + cause-gate ON (does inference
  help where the wound is deepest?).
- `exact-static-*`: EXACT transplant, gate OFF (reference anchor,
  connects to the C-series exact scale).
- `copied-*`: TRUE dose-match blind (cause-gate ON but L-forced to
  stay 0 = never-switch; isolates the switch effect from the
  machinery/flag presence).
- `unlearned` (H2 only).
8 runs/chain × 2 chains = 16 mains (pre-registered under-20: no loop
halves the arm count vs C15; the exact pair is the wound-depth probe).
- **G0**: switch-train HB ≥ 0.5 (fresh training, no transplant;
  INCOMPLETE-DESTRUCTIVE branch retained from C14/C15).
- **G2a-PRIMARY (cause-lift-over-lossy)**: switch/lossy-T1 −
  static/lossy-T1 ≥ +0.1 AND switch/lossy-T2 − static/lossy-T2
  ≥ +0.1 AND T2 ≥ T1.
- **G2b**: switch/lossy − copied/lossy pooled > 0 (the switch does
  what the flag alone doesn't).
- **G2c (direction)**: ≥2/2 chains switch HB-correctness ≥ static
  HB-correctness − 0.05 AND BH-correctness not degraded vs static
  (switch must not break acquisition).
- Verdicts C16-*; INCOMPLETE on G0 fail; INVALID on integrity/config fail.

## Loop + experiment changes (null-default additions, at implement)

`taste-energy.mjs` (or taste-experiment wrapper — implementer's choice,
frozen at implement): `interpretFlip` flag, default off/absent =
bit-identical; when on, negates cue-valence observations agent-side.
`rsi-operator-loop.mjs`: NONE (no menu, no sandbox, no fee — the loop
never fires; C16 uses only the tick-1024 hook for the single cause
vote). New instrument (`scripts/rsi-c16-dev.mjs`): chain with lossy
transplant (scaleSnapshot V1m-exact), 8 tags, 16 mains, scorer with
same-arm same-transplant pairing + switch/copied isolation check.
Tick-per-vote + `{incErr,candErr,fee}` N/A (no proposals fire —
recorded as not-applicable, C14 standard waived with reason).

## Fixtures (16), bank, caps, attempt discipline

- C15's 19 minus loop-specific (sandbox fidelity, tick/errors,
  dose-match-blind-copier kept as flag-isolation) + 3 new:
  interpretFlip null-default (absent = bit-identical world rows);
  cause-vote unit (L math: +1/−2, K=8 threshold, switch-once
  irreversibility, no-switch row = static); flip-observation unit
  (post-switch negated observations verified synthetic; BH/HB
  direction split on switched rows). Total 16.
- Fresh-32 bank `evidence/rsi-c16-dev/fresh-32/`, 9-schema, 6×9,
  range **471001–471054**. Pre-freeze check 2026-11-02: zero hits
  docs/scripts/tests/learning (evidence/ full-scan left to the
  builder per V1o precedent). attempt-01 + fresh-32 verified free
  pre-freeze (no c16 artifacts). Builder re-verifies, post-bank
  refusal, union-excluded (spent through 470xxx + own).
- Caps 16/0/28672/688128/3.4e9/10800s (V1o-linear downscale).
  ONE authorized attempt-01.
- No RSI claim on any reading (single line).

## Verdict readings (anti-hype pre-registered)

- GO (successive cause-lift-over-lossy): explicit inference adds
  where transfer works → licenses harder-gap inference lines
  (C17) + gives DTR's inference-head its first in-vivo evidence.
  NOT an RSI claim — single line, needs replication + productivity.
- NOGO: inference-gating adds nothing even with working transfer →
  closes family #1's simplest form (strong negative); program
  redirects to family-#2 variants (dissimilar pseudos) or input-side.
- All negatives preserved; no rescoring; bars unmoved.
