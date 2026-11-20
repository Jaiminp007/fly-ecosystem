#!/usr/bin/env python3
"""META_GAIN_V1: heterogeneity, funnel, and fail-safe for the deployed gain effect.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Per-pair flippedHB gain-vs-uniform HB gaps from frozen dev-results
(V1g attempt-07, V1h attempt-08, V1i attempt-09; V1f bundle attempt-06
as companion, NOT pooled — different instrument).
SE per pair: binomial, sqrt(p_g(1-p_g)/n_g + p_u(1-p_u)/n_u), contacts
from flipSplit*.flippedHB.{correctness,contact}.
Outputs: I^2, fixed/random pooled means, Egger funnel regression,
Rosenthal fail-safe N.
"""
import json, math

def load(att, gainkey):
    d = json.load(open(f"evidence/turn-gated-dev/{att}/dev-results.json"))
    fu = d["flipSplitUniform"]
    fg = d[gainkey]
    out = []
    for u, g in zip(fu, fg):
        hu, hg = u["flippedHB"], g["flippedHB"]
        if hu["correctness"] is None or hg["correctness"] is None:
            continue
        pu, nu = hu["correctness"], hu["contact"]
        pg, ng = hg["correctness"], hg["contact"]
        if not nu or not ng:
            continue
        gap = pg - pu
        se = math.sqrt(pu * (1 - pu) / nu + pg * (1 - pg) / ng)
        out.append({"gap": gap, "se": se, "n": nu + ng,
                    "pair": (u["trainSeed"], u["testSeed"])})
    return out

series = []
for att, key, tag in [("attempt-07", "flipSplitGain", "V1g"),
                      ("attempt-08", "flipSplitGain", "V1h"),
                      ("attempt-09", "flipSplitGain", "V1i")]:
    for e in load(att, key):
        e["study"] = tag
        series.append(e)
bundle = load("attempt-06", "flipSplitBundle")
print(f"gain-only pairs: {len(series)}; V1f-bundle pairs (companion): {len(bundle)}")

thetas = [e["gap"] for e in series]
ses = [e["se"] for e in series]
w = [1 / s / s for s in ses]
th_fix = sum(x * wi for x, wi in zip(thetas, w)) / sum(w)
Q = sum(wi * (x - th_fix) ** 2 for x, wi in zip(thetas, w))
df = len(thetas) - 1
I2 = max(0.0, (Q - df) / Q) if Q else 0.0
tau2 = max(0.0, (Q - df) / (sum(w) - sum(wi * wi for wi in w) / sum(w))) if sum(w) else 0.0
wr = [1 / (s * s + tau2) for s in ses]
th_rnd = sum(x * wi for x, wi in zip(thetas, wr)) / sum(wr)
se_rnd = math.sqrt(1 / sum(wr))
print(f"fixed pooled={th_fix:.4f}  Q={Q:.2f} df={df} I2={I2:.3f}")
print(f"random pooled={th_rnd:.4f} SE={se_rnd:.4f} 95%CI=[{th_rnd-1.96*se_rnd:.4f},{th_rnd+1.96*se_rnd:.4f}] tau2={tau2:.6f}")
for e in series:
    print(f"  {e['study']} {e['pair']}: gap={e['gap']:+.4f} se={e['se']:.4f}")
# Egger: effect ~ se (weighted by 1/se^2); intercept != 0 = small-study effects
mx = sum(1 / s for s in ses) / len(ses)
my = sum(t / s / s for t, s in zip(thetas, ses)) / sum(1 / s / s for s in ses)
# regress z=theta/se on precision=1/se
zx = [t / s for t, s in zip(thetas, ses)]
px = [1 / s for s in ses]
mx, my = sum(px) / len(px), sum(zx) / len(zx)
b = sum((x - mx) * (y - my) for x, y in zip(px, zx)) / sum((x - mx) ** 2 for x in px)
a = my - b * mx
print(f"Egger: slope={b:.4f} intercept={a:.3f} (intercept~=0 means no funnel asymmetry)")
# Rosenthal fail-safe N on z-scores
zs = [t / s for t, s in zip(thetas, ses)]
k = len(zs)
nfs = (sum(zs) ** 2) / 2.706 - k
print(f"Rosenthal fail-safe N={nfs:.1f} (null studies to overturn, k={k})")
bg = [e["gap"] for e in bundle]
print(f"V1f bundle (companion, not pooled): mean={sum(bg)/len(bg):+.4f} " +
      " ".join(f"{x:+.4f}" for x in bg))
