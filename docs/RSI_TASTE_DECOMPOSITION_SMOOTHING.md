# RSI decomposition: smoothing loses lifetime behaviorally, not computationally

Paired per-seed candidate endpoints, v7 bank, Gen0 vs γ=0.05/μ=0.2 stack
(`gen0-search4` vs `a7m-02`, same 4 seeds):

| seed | Δlifetime/founder | Δpaid compute | Δbeneficial | Δharmful | Δtoxin | Δsurvivors |
|---|---|---|---|---|---|---|
| 1739957528 | −0.53 | +2.93 | +57.0 | +62.5 | +62.1 | −2 |
| 2009043353 | −1.32 | +0.81 | −20.7 | +69.7 | +69.5 | −2 |
| 3855512412 | −3.43 | +2.52 | −8.3 | +84.9 | +84.9 | −4 |
| 792922325 | −3.13 | +1.48 | −49.0 | +74.0 | +73.1 | −4 |

Colony-scale gap is −13 to −82 energy; extra billed compute explains <10%.
The loss is **behavioral**: smoothed predictors eat +62–85 more harmful food
with +62–85 more toxin damage and lose 2–4 survivors per seed. Anchoring to
slow weights preserves stale A-contingencies into B/C — stability bought
with negative transfer. This is a measured stability–plasticity dilemma, not
an accounting artifact.

Consequence: no backward-looking anchor can break the joint gate — anything
that drags B-learning toward A-weights poisons B-foraging. The remaining
idea class is **forward compartmentalization**: separate skill streams with
endogenous competitive gating (own prediction errors), so the A-stream
freezes during B/C (no overwrite) while the B-stream learns undragged
(no anchor). See amendment v7.
