#!/usr/bin/env python3
"""TRANSFER_CLOCK_V1: does retained-weight divergence predict the transfer tax?

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/turn-gated-dev/attempt-{02..10}/dev-results.json
(trainGaps/transGaps seg1 exact; attempt-10 flips lift for lossy) +
train rows ({seed}-train.json weights: {founderId: {taste: [...], ...}}).

Clock hypothesis (R118 Horvath-analog, naive form): bigger divergence D
(train->transplant weight distance) -> bigger tax T = trainGap - transGap.
Exact transplants: D ~ 0 by integrity (digest-verified); lossy (x0.5):
D = 0.5*||w_train|| (deterministic, no transferred weights needed).
Pair rule: transSeed = trainSeed + 9 (verified per pair, skip on mismatch).
Seg2/gain-modified transplants excluded (different instrument); attempt-01
excluded (no transferred arm).

Tests (pre-registered in script):
 T1: at D~0 (exact), does trainGap predict transGap (proportional tax)?
 T2: does ||w_train|| (divergence capacity) predict tax?
 T3: lossy direction — bigger D -> SMALLER tax (anti-clock, V1j moral)?
"""
import json, glob, math, os

def flat(x):
    if isinstance(x, (list, tuple)):
        for v in x:
            yield from flat(v)
    elif isinstance(x, dict):
        for v in x.values():
            yield from flat(v)
    elif isinstance(x, (int, float)):
        yield x

def wnorm(path):
    r = json.load(open(path))
    vals = list(flat(r.get("weights")))
    return math.sqrt(sum(v * v for v in vals)) if vals else None

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    den = (sum((a - mx) ** 2 for a in xs) * sum((b - my) ** 2 for b in ys)) ** 0.5
    return sum((a - mx) * (b - my) for a, b in zip(xs, ys)) / den if den else 0.0

pairs = []  # (attempt, trainSeed, trainGap, transGap, wnorm)
for att in [f"attempt-{i:02d}" for i in range(2, 11)]:
    d = json.load(open(f"evidence/turn-gated-dev/{att}/dev-results.json"))
    tg, xg = d.get("trainGaps", []), d.get("transGaps", [])
    if len(tg) != len(xg):
        print(f"{att}: SKIP length mismatch {len(tg)} vs {len(xg)}")
        continue
    for t, x in zip(sorted(tg, key=lambda e: e["seed"]), sorted(xg, key=lambda e: e["seed"])):
        if x["seed"] != t["seed"] + 9:
            print(f"{att}: SKIP pairing {t['seed']} vs {x['seed']}")
            continue
        rows = glob.glob(f"evidence/turn-gated-dev/{att}/rows/{t['seed']}-train.json")
        wn = wnorm(rows[0]) if rows else None
        pairs.append({"att": att, "tr": t["seed"], "trainGap": t["gap"],
                      "transGap": x["gap"], "tax": t["gap"] - x["gap"], "wnorm": wn})
print(f"pairs: {len(pairs)}")
tg = [p["trainGap"] for p in pairs]
xg = [p["transGap"] for p in pairs]
tx = [p["tax"] for p in pairs]
wn = [p["wnorm"] for p in pairs if p["wnorm"] is not None]
print(f"T1: trainGap range [{min(tg):.3f},{max(tg):.3f}] transGap range [{min(xg):.3f},{max(xg):.3f}]")
print(f"T1: corr(trainGap,transGap) = {pearson(tg, xg)}; medTax = {med(tx)}")
pw = [p for p in pairs if p["wnorm"] is not None]
print(f"T2: n={len(pw)} wnorm range [{min(wn):.1f},{max(wn):.1f}] corr(wnorm,tax) = "
      f"{pearson([p['wnorm'] for p in pw], [p['tax'] for p in pw])}")
# T3 lossy (attempt-10 flips lift + deterministic D)
d10 = json.load(open("evidence/turn-gated-dev/attempt-10/dev-results.json"))
fl = d10.get("flips", [])
p10 = [p for p in pairs if p["att"] == "attempt-10"]
print(f"T3: attempt-10 pairs={len(p10)} flips={len(fl)}")
for p, f in zip(sorted(p10, key=lambda e: e["tr"]), fl):
    D = 0.5 * (p["wnorm"] or float("nan"))
    print(f"  tr={p['tr']} wnorm={p['wnorm']:.1f} D_lossy={D:.1f} tax_exact={p['tax']:.4f} "
          f"lift={f['lift']:.4f} tax_lossy={p['tax'] - f['lift']:.4f}")
