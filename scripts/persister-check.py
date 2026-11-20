#!/usr/bin/env python3
"""PERSISTER_CHECK_V1: are long-lived childless cohorts senescent persisters or reserves?

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json summaries:
  gen1Lifespan {mean, n, censored} + generations.byGeneration + arm/births.

Patterns (arm/row level; individual linkage blocked — see doc):
  persister-like = long-lived gen-1 (high mean, high censored frac) + zero conversion
  reserve-like   = long-lived gen-1 + conversion (gen2 > 0)
Compares lifespan summaries between converting vs non-converting rows.
Censoring note: censored individuals were alive at run end, so reported
means are LOWER bounds on true cohort lifespan.
"""
import json, glob
from collections import defaultdict

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

rows = []
for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
    r = json.load(open(p))
    g = r.get("gen1Lifespan")
    if not (isinstance(g, dict) and "mean" in g and g.get("mean") is not None
            and (g.get("n") or 0) > 0):
        continue  # undefined lifespan (no gen-1); e.g. MLR1 441028-spread, noted in doc
    by = ((r.get("generations") or {}).get("byGeneration")) or {}
    rows.append({
        "file": p.replace("\\", "/").split("/")[-1],
        "bank": p.replace("\\", "/").split("/")[1],
        "arm": r.get("arm"), "mean": g.get("mean"), "n": g.get("n"),
        "cens": (g.get("censored") or 0) / max(1, g.get("n") or 1),
        "gen1": int(by.get("1", 0) or 0), "gen2": int(by.get("2", 0) or 0),
        "births": r.get("births"),
    })

print(f"rows: {len(rows)}")
conv1 = [x for x in rows if x["gen2"] >= 1]
conv2 = [x for x in rows if x["gen2"] >= 2]
nonc = [x for x in rows if x["gen2"] == 0]
print(f"converting gen2>=1: {len(conv1)}, gen2>=2: {len(conv2)}, zero-conversion: {len(nonc)}")
for name, grp in [("gen2>=1", conv1), ("gen2>=2", conv2), ("gen2==0", nonc)]:
    print(f"{name}: n={len(grp)} medMean={med([x['mean'] for x in grp])} "
          f"medCens={med([x['cens'] for x in grp])} medGen1={med([x['gen1'] for x in grp])} "
          f"medBirths={med([x['births'] for x in grp])}")
# persister candidates: top-quartile lifespan AND zero conversion
means = sorted(x["mean"] for x in rows)
q75 = means[int(0.75 * len(means))]
cand = [x for x in rows if x["mean"] >= q75 and x["gen2"] == 0]
print(f"\nq75 lifespan = {q75}; long-lived + zero-conversion rows: {len(cand)}")
ab = defaultdict(int)
for x in cand:
    ab[(x["bank"], x["arm"])] += 1
for (b, a), c in sorted(ab.items()):
    print(f"  {b} {a}: {c}")
# reserves: top-quartile lifespan AND conversion
res = [x for x in rows if x["mean"] >= q75 and x["gen2"] >= 1]
print(f"long-lived + converting rows: {len(res)}")
