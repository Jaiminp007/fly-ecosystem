# RSI-LESION PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
Does a self-proposed taste-dim ablation (lesion) transfer better than
fixed-rate learning and unlearned control, under V1's independent
transfer eval?

## Why this edit (last standing adoption-capable edit; genuinely new)
- Full edit-space audit (preserved): rate (V1a harm/banned), shrink/skip/
  gain (V1b NOGO/banned-by-rescore), margin (V1b never-persisted + M-GATE
  null = twice-null), freeze (V1c NOGO/banned), full taste reset (V1-reset
  void 0/133/banned), actor/critic edits (sandbox-invisible by
  construction), rehearsal (surprise NOGO/banned), sparse (C14 NOGO-flat,
  channel closed), slow/consolidation (loses newest-test → structural
  void), noise (hurts → void), schedule (V1c-adjacent/banned).
- Lesion (ablate half the taste dims, permanently) is none of these: not
  a dial (binary structure), not a freeze (learning continues on the
  survivor dims), not a full reset (selective halves, not zeroing), not
  rehearsal (weights, not records), not C14 input-conditioning (permanent
  dim removal, not per-input gating). Rationale (never the basis of any
  line): skill localization → denoise → generalization. If foraging skill
  lives in a subset of dims, ablating the noisy remainder helps both
  prediction (sandbox) and transfer; if distributed, the sandbox keeps
  (correct rejection). Stated boundary: a strict auditor may read this as
  selectivity-adjacent to C14; the defense is permanence + dim-axis +
  denoise-rationale vs conditional + input-axis + efficiency-rationale.
  One-way (first adoption sticks — no restoration, no second ablation
  toward full-reset) to keep the reset boundary clean.

## Design (V1a sandbox + V1 transfer; only the family is new)
- Menu per agent at checkpoints {512,1024,1536}: incumbent (full, replay
  fit) vs {ablate dims[0:8], ablate dims[8:16]} (D=16 orthogonal; zero
  half, replay fit, test newest-8, MSE). Adopt best iff < inc×0.99.
  One-way: after an adoption, later checkpoints skip (reason 'lesioned').
  Skip if store<16 (V1a threshold).
- Fee (symmetric, documented): (1+nCand)×(fitN+testN)×(D+1), nCand=2
  pre-adoption (3×), 0 after (skip, no eval).
- Train arms: selfmod (lesions) / fixed (full always) / unlearned.
  2 pairs × (3 trains + 3 transfer probes) = 12 mains, 0 probes.
- Transfer (V1 exact): same-codebook paired histories, full-body
  transplant (lesioned weights) with digests, probe at default config
  (V1a precedent: isolate weight effects), probe learns normally.
  Endpoint = budgetAdjustedEnergyPerFounder.
- Verdict: GO (`RSI-LESION-GO-V1`) iff mean(selfmod) > mean(fixed) AND >
  mean(unlearned). Else NOGO (`RSI-LESION-NOGO-V1`). Zero adopts →
  `INCOMPLETE-NOADOPT` (void — contrast vacuous). No RSI/retention/
  population claim (thin n=2, licenses replication only on GO).
- Bank: fresh-09, 474109–474144 (4 histories × 9, 36 unique), minted
  post-fixtures, verified clean. Triage (apply path): ONE throwaway
  candidate run (T=512 equivalent — 640 ticks, 1 checkpoint) on
  490019–490027 (added to spent, disclosed) BEFORE bank mint; exercises
  propose+ablate-apply without touching bank seeds. Caps: BT ticks/caps.
  Single attempt. Disk floor 1 GB (free ~1.2G; stop run if <1G).
