#!/usr/bin/env python3
"""SKEW_MEASUREMENT_V1: reproductive-skew formalization on frozen mating rows.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/*/attempt-*/rows/*.json tallies (founderOffspring:
per-parent birth attributions, maternal+paternal combined; absent key = 0).

Per row (founders only, ids 1..N, N=24 except where row says otherwise):
  K_f      = total founder attributions
  p_i      = c_i / K_f
  B        = sum((p_i - 1/N)^2) - (1 - 1/N)/K_f   (Nonacs skew index)
  p-value  = Monte-Carlo multinomial(K_f, 1/N), 20000 sims (analysis RNG only)
  maxShare = max p_i; zerosFrac = #{c_i=0}/N
Descendant attributions (keys > N) reported separately, excluded from B.
Rows with K_f == 0 counted in no-reproduction tally, excluded from B.
"""
import json, glob, os, random
from collections import defaultdict

random.seed(20261102)  # analysis RNG only; not a bank seed, spends nothing

ROW_GLOBS = [
    "evidence/mate-attract-dev/attempt-0*/rows/*.json",
    "evidence/mate-disperse-dev/attempt-01/rows/*.json",
    "evidence/mate-encounter-dev/attempt-0*/rows/*.json",
    "evidence/mate-informed-dev/attempt-01/rows/*.json",
    "evidence/mate-leave-dev/attempt-0*/rows/*.json",
    "evidence/mate-proximity-dev/attempt-0*/rows/*.json",
    "evidence/mate-recombine-dev/attempt-01/rows/*.json",
    "evidence/mate-social-dev/attempt-0*/rows/*.json",
]

def monte_carlo_p(K, N, B_obs, sims=20000):
    if K <= 0:
        return None
    ge = 0
    exp = (1 - 1 / N) / K
    for _ in range(sims):
        counts = [0] * N
        for _ in range(K):
            counts[random.randrange(N)] += 1
        B = sum((c / K - 1 / N) ** 2 for c in counts) - exp
        if B >= B_obs:
            ge += 1
    return ge / sims

def analyze_row(path):
    r = json.load(open(path))
    fo = r.get("founderOffspring")
    if not isinstance(fo, dict):
        return None
    N = int(r.get("founders", 24))
    fc = [int(fo.get(str(i), fo.get(i, 0)) or 0) for i in range(1, N + 1)]
    desc = sum(int(v) for k, v in fo.items() if int(k) > N)
    K = sum(fc)
    seed = r.get("history", {}).get("seed")
    arm = r.get("arm")
    out = {"file": os.path.basename(path), "arm": arm, "seed": seed,
           "births": r.get("births"), "N": N, "K": K, "descAttr": desc}
    if K == 0:
        out["B"] = None
        return out
    p = [c / K for c in fc]
    B = sum((x - 1 / N) ** 2 for x in p) - (1 - 1 / N) / K
    out["B"] = B
    out["p"] = monte_carlo_p(K, N, B)
    out["maxShare"] = max(p)
    out["zerosFrac"] = sum(1 for c in fc if c == 0) / N
    return out

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

def main():
    rows = []
    for g in ROW_GLOBS:
        for path in sorted(glob.glob(g)):
            a = analyze_row(path)
            if a:
                # bank label: grandparent dir + attempt dir
                parts = path.replace(chr(92), "/").split("/")
                a["bank"] = parts[1] + "/" + parts[2]
                rows.append(a)
    print(f"rows read: {len(rows)}")
    # per (bank, arm) aggregates
    groups = defaultdict(list)
    for a in rows:
        groups[(a["bank"], a["arm"])].append(a)
    print("\nbank | arm | n | nRepro | medB | medP | fracSig | medMaxShare | medZeros | medK | medBirths")
    for (bank, arm) in sorted(groups):
        g = groups[(bank, arm)]
        repro = [x for x in g if x["B"] is not None]
        print(f"{bank} | {arm} | {len(g)} | {len(repro)} | "
              f"{med([x['B'] for x in repro])} | {med([x['p'] for x in repro])} | "
              f"{sum(1 for x in repro if x['p'] is not None and x['p'] < 0.05)}/{len(repro)} | "
              f"{med([x['maxShare'] for x in repro])} | {med([x['zerosFrac'] for x in repro])} | "
              f"{med([x['K'] for x in repro])} | {med([x['births'] for x in g])}")
    # paired hub-vs-spread B differences (same seed)
    print("\npaired hub-spread B diffs (hub minus spread, same seed):")
    diffs = []
    for bank in sorted(set(b for b, _ in groups)):
        arms = set(a for (b, a) in groups if b == bank)
        hub = next((a for a in arms if a == "hub" or a.startswith("hub")), None)
        if "spread" in arms and hub:
            hm = {x["seed"]: x["B"] for x in groups[(bank, hub)]}
            sm = {x["seed"]: x["B"] for x in groups[(bank, "spread")]}
            for s in sorted(set(hm) & set(sm)):
                if hm[s] is not None and sm[s] is not None:
                    diffs.append((bank, s, hm[s] - sm[s]))
                    print(f"  {bank} seed {s}: {hm[s] - sm[s]:+.4f}")
    if diffs:
        ds = [d for _, _, d in diffs]
        print(f"  n={len(ds)} medDiff={med(ds):+.4f} fracPositive={sum(1 for d in ds if d>0)}/{len(ds)}")
    # paired hubLeave-vs-hub B differences
    print("\npaired hubLeave-vs-hub B diffs (leave minus hub, same seed):")
    for bank in sorted(set(b for b, _ in groups)):
        arms = set(a for (b, a) in groups if b == bank)
        if "hub" in arms:
            hm = {x["seed"]: x["B"] for x in groups[(bank, "hub")]}
            for la in sorted(a for a in arms if a != "hub" and a != "spread" and "hub" in str(a).lower() or (a or "").startswith("hubLeave")):
                lm = {x["seed"]: x["B"] for x in groups[(bank, la)]}
                ds = [(s, lm[s] - hm[s]) for s in sorted(set(lm) & set(hm))
                      if lm[s] is not None and hm[s] is not None]
                if ds:
                    vs = [d for _, d in ds]
                    print(f"  {bank} {la}: n={len(vs)} medDiff={med(vs):+.4f} " +
                          " ".join(f"{s}:{d:+.3f}" for s, d in ds))
    # copycond/copyalways vs maternal
    print("\npaired copy-vs-maternal B diffs (copy minus maternal, same seed):")
    for bank in sorted(set(b for b, _ in groups)):
        arms = set(a for (b, a) in groups if b == bank)
        if "maternal" in arms:
            mm = {x["seed"]: x["B"] for x in groups[(bank, "maternal")]}
            for ca in sorted(a for a in arms if a != "maternal"):
                cm = {x["seed"]: x["B"] for x in groups[(bank, ca)]}
                ds = [(s, cm[s] - mm[s]) for s in sorted(set(cm) & set(mm))
                      if cm[s] is not None and mm[s] is not None]
                if ds:
                    vs = [d for _, d in ds]
                    print(f"  {bank} {ca}: n={len(vs)} medDiff={med(vs):+.4f} " +
                          " ".join(f"{s}:{d:+.3f}" for s, d in ds))

if __name__ == "__main__":
    main()
