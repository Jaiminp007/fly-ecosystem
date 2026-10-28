# RSI plan amendment v3: memory-policy dimension (frozen)

Motivation: two full rounds (gen1 td failed fresh eval; gen2 progress-subspace no
claimant) exhausted the fixed-memory (32/8) menu. Memory policy is the natural
next revision axis: retention failures (A-retention, B-retention) are failures
of what the learner keeps under interference, and larger memory pays honest
energy via per-step `byteEnergyPerSecond × storageBytes` billing
(`chargeForStep`), so capacity cannot be a free lunch — the budget accounts it.

Change (source now `taste-energy.mjs` with `capacity`/`recent` honored):
* `createTasteEnergyBody` accepts `capacity` (1–64) and `recent` (1–capacity);
  defaults 32/8 reproduce old behavior exactly (all 18 unit tests pass,
  including the 320-tick 8/24 retention-shape test).
* `remember` keeps `recent` newest + reservoir of `capacity−recent` older;
  restore/validation parameterized; old saved states backfilled to 32/8.
* Runner accepts `--capacity`/`--recent`, recorded in `attempt.json`.

Menu (all under Gen0's transfer-safe `progress/hold1` family unless a proposal
explicitly varies `motorRule` — no: v3 keeps `progress/hold1` fixed; motor
variation stays closed after the td transfer failure):
* `capacity ∈ {16, 32, 64}` × `recent ∈ {4, 8, 16}` with recent≤capacity = 7
  configs (32/8 is Gen0). Storage cost billed per world; world caps unchanged
  (≤96/procedure, fresh banks, full v2 fresh-eval gates + world-cap for any
  claimant, copy control, ≥2 successive + productivity thresholds).
* Hypothesis (falsifiable): a larger-older reservoir (e.g. 64/8) holds both
  skills' retention without surrendering lifetime net of storage cost; or a
  smaller-faster buffer (16/4) cuts storage cost enough to win net. Either must
  survive fresh eval with transfer tie.

Rules unchanged: new search bank v4 + new eval banks; ≤6 proposals/procedure;
prior failures (gen1 td, gen2 subspace) stand; 0/2 accepts; cumulative 704
worlds before v3 (new spending counted from here).
