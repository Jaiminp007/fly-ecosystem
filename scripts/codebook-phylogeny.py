#!/usr/bin/env python3
"""CODEBOOK_PHYLOGENY_V1: star test + ecology-side clock (recode vs revalue).

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Codebooks dumped by scripts/dump-codebooks.mjs (exact repo code path).
Per-id canonical key: (family in {A,B,C,None}, valence in {+1,-1,None}).

Distances (fraction of 16 ids differing):
  d_total   = key differs
  d_family  = family differs (recoding: which patterns group together)
  d_revalue = family same but valence differs (revaluation: same bits, new good/bad)

Test A (star phylogeny, R111): within-bank vs across-bank d_total over all
mating + turn-gate bank histories. Star iff within ~= across (no clustering).
Test B (ecology-side clock + SR port R120): for the 27 transfer pairs, corr of
d_family / d_revalue with tax. SR predicts d_family breaks transfer (transition
change) while d_revalue transfers (reward change).
"""
import json, subprocess, glob, os, math
from collections import defaultdict

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

# collect (bank, seed, cueSeed) from all mating + turn-gated protocols
entries = []
for p in sorted(glob.glob("evidence/mate-*/attempt-*/protocol.json") +
                glob.glob("evidence/turn-gated-dev/attempt-*/protocol.json")):
    r = json.load(open(p))
    parts = p.replace("\\", "/").split("/")
    bank = parts[1] + "/" + parts[2]
    for h in r.get("histories", []):
        if "cueSeed" in h:
            entries.append((bank, h["seed"], h["cueSeed"]))
print(f"histories with cueSeeds: {len(entries)}")

seeds = sorted(set(c for _, _, c in entries))
proc = subprocess.run(["node", "scripts/dump-codebooks.mjs"], input="\n".join(map(str, seeds)),
                      capture_output=True, text=True, cwd=os.getcwd())
cbs = json.loads(proc.stdout)
print(f"codebooks dumped: {len(cbs)}")

def dist(a, b):
    A, B = cbs[str(a)], cbs[str(b)]
    tot = fam = rev = 0
    for i in map(str, range(1, 17)):
        ka, kb = A.get(i, [None, None]), B.get(i, [None, None])
        if ka != kb:
            tot += 1
        if ka[0] != kb[0]:
            fam += 1
        elif ka[1] != kb[1]:
            rev += 1
    return tot / 16, fam / 16, rev / 16

# Test A
byBank = defaultdict(list)
for bank, s, c in entries:
    byBank[bank].append(c)
within, across = [], []
banks = sorted(byBank)
for i, b in enumerate(banks):
    cs = byBank[b]
    for x in range(len(cs)):
        for y in range(x + 1, len(cs)):
            within.append(dist(cs[x], cs[y])[0])
    for b2 in banks[i + 1:]:
        for c1 in cs:
            for c2 in byBank[b2][:6]:
                across.append(dist(c1, c2)[0])
print(f"\nTest A: within-bank pairs={len(within)} med={med(within):.4f}; "
      f"across-bank pairs={len(across)} med={med(across):.4f}")

# Test B: the 27 transfer pairs (reuse transfer-clock pairing)
taxByTr = {}
for att in ["attempt-02", "attempt-03", "attempt-04", "attempt-05", "attempt-06",
            "attempt-07", "attempt-08", "attempt-09", "attempt-10"]:
    d = json.load(open(f"evidence/turn-gated-dev/{att}/dev-results.json"))
    tg = sorted(d.get("trainGaps", []), key=lambda e: e["seed"])
    xg = sorted(d.get("transGaps", []), key=lambda e: e["seed"])
    if len(tg) != len(xg):
        continue
    for t, x in zip(tg, xg):
        if x["seed"] == t["seed"] + 9:
            taxByTr[(att, t["seed"], x["seed"])] = t["gap"] - x["gap"]
cueOf = {(b, s): c for b, s, c in entries}
rows = []
for (att, tr, te), tax in taxByTr.items():
    b = "turn-gated-dev/" + att
    c1, c2 = cueOf.get((b, tr)), cueOf.get((b, te))
    if c1 and c2:
        dt, df, dr = dist(c1, c2)
        rows.append((tax, dt, df, dr))
print(f"\nTest B: pairs={len(rows)}")
print(f"  d_total range [{min(r[1] for r in rows):.3f},{max(r[1] for r in rows):.3f}] "
      f"corr(d_total,tax)={pearson([r[1] for r in rows],[r[0] for r in rows])}")
print(f"  d_family range [{min(r[2] for r in rows):.3f},{max(r[2] for r in rows):.3f}] "
      f"corr(d_family,tax)={pearson([r[2] for r in rows],[r[0] for r in rows])}")
print(f"  d_revalue range [{min(r[3] for r in rows):.3f},{max(r[3] for r in rows):.3f}] "
      f"corr(d_revalue,tax)={pearson([r[3] for r in rows],[r[0] for r in rows])}")
